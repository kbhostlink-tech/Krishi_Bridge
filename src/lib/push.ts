/**
 * Push notification service — Firebase Cloud Messaging (FCM) via HTTP v1 API.
 *
 * Gracefully degrades when Firebase credentials are not configured.
 * Uses FCM HTTP v1 API with service account credentials.
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY (PEM format, with \n escaped)
 */

import { prisma } from "@/lib/prisma";
import { SignJWT, importPKCS8 } from "jose";

// ─── CONFIGURATION ───────────────────────────

const FCM_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FCM_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FCM_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const FCM_ENABLED = !!(FCM_PROJECT_ID && FCM_CLIENT_EMAIL && FCM_PRIVATE_KEY);

// Cache the OAuth2 access token (expires every ~55 min)
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// ─── OAUTH2 TOKEN ────────────────────────────

async function getAccessToken(): Promise<string | null> {
  if (!FCM_ENABLED || !FCM_PRIVATE_KEY || !FCM_CLIENT_EMAIL) return null;

  // Return cached token if still valid (5-min buffer)
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 5 * 60 * 1000) {
    return cachedAccessToken.token;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const privateKey = await importPKCS8(FCM_PRIVATE_KEY, "RS256");

    const jwt = await new SignJWT({
      iss: FCM_CLIENT_EMAIL,
      sub: FCM_CLIENT_EMAIL,
      aud: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!resp.ok) {
      console.error("[PUSH] OAuth2 token request failed:", await resp.text());
      return null;
    }

    const data = await resp.json();
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return cachedAccessToken.token;
  } catch (error) {
    console.error("[PUSH] Failed to get access token:", error);
    return null;
  }
}

// ─── SEND PUSH ───────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  link?: string;
}

/**
 * Send a push notification to a single FCM token.
 * Returns true if sent successfully, false otherwise.
 */
async function sendToToken(fcmToken: string, payload: PushPayload): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const resp = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            webpush: {
              notification: {
                icon: payload.icon || "/icon-192.png",
                badge: "/badge-72.png",
                tag: payload.data?.event || "notification",
                requireInteraction: true,
              },
              fcm_options: {
                link: payload.link || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              },
            },
            data: payload.data || {},
          },
        }),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      // Token expired or invalid — remove it
      if (resp.status === 404 || errorText.includes("NOT_FOUND") || errorText.includes("UNREGISTERED")) {
        await prisma.pushSubscription.deleteMany({ where: { token: fcmToken } });
        console.log("[PUSH] Removed stale FCM token");
      } else {
        console.error("[PUSH] FCM send failed:", errorText);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("[PUSH] Error sending push:", error);
    return false;
  }
}

/**
 * Send push notification to all devices registered by a user.
 * Fire-and-forget safe — catches all errors.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!FCM_ENABLED) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { token: true },
    });

    if (subscriptions.length === 0) return;

    await Promise.allSettled(
      subscriptions.map((sub) => sendToToken(sub.token, payload))
    );
  } catch (error) {
    console.error(`[PUSH] Failed to send push to user ${userId}:`, error);
  }
}

/**
 * Send push notification to multiple users.
 */
export async function sendPushToMany(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (!FCM_ENABLED || userIds.length === 0) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    if (subscriptions.length === 0) return;

    await Promise.allSettled(
      subscriptions.map((sub) => sendToToken(sub.token, payload))
    );
  } catch (error) {
    console.error("[PUSH] Failed to send batch push:", error);
  }
}

export { FCM_ENABLED };

