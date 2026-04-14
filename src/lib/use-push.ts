"use client";

/**
 * Firebase Cloud Messaging client hook.
 *
 * Handles:
 * - Service worker registration
 * - Permission request (non-intrusive, on first user action)
 * - FCM token registration with the server
 * - Foreground message handling
 *
 * Required env vars (NEXT_PUBLIC_*):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const IS_CONFIGURED =
  !!FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.apiKey !== "" &&
  !!FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.projectId !== "";

export function usePushNotifications(onForegroundMessage?: (payload: { title: string; body: string }) => void) {
  const { user, accessToken } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const registeredRef = useRef(false);

  // Check initial permission state
  useEffect(() => {
    if (!IS_CONFIGURED || typeof window === "undefined") {
      setPermission("unsupported");
      return;
    }
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Register FCM token with server
  const registerToken = useCallback(
    async (fcmToken: string) => {
      if (!accessToken) return;
      try {
        await fetch("/api/notifications/push-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ token: fcmToken, platform: "web" }),
        });
      } catch (err) {
        console.error("[PUSH] Failed to register token with server:", err);
      }
    },
    [accessToken]
  );

  // Request permission and set up FCM
  const requestPermission = useCallback(async () => {
    if (!IS_CONFIGURED || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") return; // already granted

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (err) {
      console.error("[PUSH] Permission request failed:", err);
    }
  }, []);

  // Set up FCM when permission is granted and user is logged in
  useEffect(() => {
    if (!IS_CONFIGURED || !user || permission !== "granted" || registeredRef.current) return;
    if (typeof window === "undefined") return;

    let cleanup = false;

    (async () => {
      try {
        // Dynamically import Firebase modules (tree-shakable)
        const { initializeApp, getApps } = await import("firebase/app");
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

        // Register service worker
        const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

        // Send config to service worker
        swRegistration.active?.postMessage({
          type: "FIREBASE_CONFIG",
          config: FIREBASE_CONFIG,
        });

        // Initialize Firebase
        const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
        const messaging = getMessaging(app);

        // Get FCM token
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
          serviceWorkerRegistration: swRegistration,
        });

        if (currentToken && !cleanup) {
          registeredRef.current = true;
          await registerToken(currentToken);
        }

        // Handle foreground messages
        if (!cleanup) {
          onMessage(messaging, (payload) => {
            const title = payload.notification?.title || "New Notification";
            const body = payload.notification?.body || "";
            onForegroundMessage?.({ title, body });
          });
        }
      } catch (err) {
        console.error("[PUSH] Setup failed:", err);
      }
    })();

    return () => {
      cleanup = true;
    };
  }, [user, permission, registerToken, onForegroundMessage]);

  return { permission, requestPermission, isConfigured: IS_CONFIGURED };
}
