/**
 * Notification service — central dispatch for all platform notifications.
 *
 * Channels: In-App (DB), Email (Resend/SES), Push (Firebase FCM).
 * Localizes email content using the user's preferredLang.
 *
 * Usage patterns:
 *   1. Full dispatch (all channels): notifyUser({ userId, event, title, body })
 *   2. Email + push only (in-app already created in transaction):
 *      notifyUser({ userId, event, title, body, channels: ['email', 'push'] })
 *   3. Batch: notifyMany([...])
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getEmailTemplate, type NotificationEvent } from "@/lib/email-templates";
import { sendPushToUser } from "@/lib/push";
import type { Prisma } from "@/generated/prisma/client";

export type { NotificationEvent };

export type NotificationChannel = "in_app" | "email" | "push";

export interface NotifyOptions {
  userId: string;
  event: NotificationEvent;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Which channels to dispatch to. Default: all three. */
  channels?: NotificationChannel[];
  /** Link URL for push notification click action */
  link?: string;
}

const ALL_CHANNELS: NotificationChannel[] = ["in_app", "email", "push"];

/**
 * Dispatch a notification to a user across specified channels.
 * Fire-and-forget safe — errors are caught and logged, never thrown.
 */
export async function notifyUser(options: NotifyOptions): Promise<void> {
  const {
    userId,
    event,
    title,
    body,
    data,
    channels = ALL_CHANNELS,
    link,
  } = options;

  try {
    // 1. In-App notification (DB record)
    if (channels.includes("in_app")) {
      await prisma.notification.create({
        data: {
          userId,
          type: "IN_APP",
          title,
          body,
          data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    }

    // 2. Email + Push — fetch user details for localization + preferences
    if (channels.includes("email") || channels.includes("push")) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, preferredLang: true, notificationPrefs: true },
      });

      if (user) {
        // Respect user notification preferences
        const prefs = (user.notificationPrefs as Record<string, unknown>) || {};
        const emailEnabled = prefs.email !== false; // default: true
        const pushEnabled = prefs.push !== false; // default: true

        // Email dispatch (fire-and-forget)
        if (channels.includes("email") && emailEnabled) {
          const lang = user.preferredLang || "en";
          const template = getEmailTemplate(event, lang, {
            userName: user.name,
            title,
            body,
            ...data,
          });

          sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
          }).catch((err) => {
            console.error(`[NOTIFY] Email failed for ${event} to ${user.email}:`, err);
          });
        }

        // Push dispatch (fire-and-forget)
        if (channels.includes("push") && pushEnabled) {
          sendPushToUser(userId, {
            title,
            body,
            data: {
              event,
              ...(data
                ? Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                  )
                : {}),
            },
            link,
          }).catch((err) => {
            console.error(`[NOTIFY] Push failed for ${event} to user ${userId}:`, err);
          });
        }
      }
    }
  } catch (error) {
    console.error(`[NOTIFY] Failed to notify user ${userId} for event ${event}:`, error);
  }
}

/**
 * Dispatch notifications to multiple users.
 * Uses createMany for in-app (single DB round-trip) + parallelized email/push.
 */
export async function notifyMany(
  notifications: Array<NotifyOptions>
): Promise<void> {
  if (notifications.length === 0) return;

  try {
    // 1. Batch create in-app notifications
    const inAppNotifications = notifications.filter(
      (n) => !n.channels || n.channels.includes("in_app")
    );
    if (inAppNotifications.length > 0) {
      await prisma.notification.createMany({
        data: inAppNotifications.map((n) => ({
          userId: n.userId,
          type: "IN_APP" as const,
          title: n.title,
          body: n.body,
          data: (n.data ?? undefined) as Prisma.InputJsonValue | undefined,
        })),
      });
    }

    // 2. Gather user info for email/push
    const needsExternal = notifications.filter(
      (n) =>
        !n.channels ||
        n.channels.includes("email") ||
        n.channels.includes("push")
    );

    if (needsExternal.length > 0) {
      const userIds = [...new Set(needsExternal.map((n) => n.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, preferredLang: true, notificationPrefs: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Email dispatch (parallelized, fire-and-forget)
      const emailNotifications = needsExternal.filter(
        (n) => !n.channels || n.channels.includes("email")
      );
      if (emailNotifications.length > 0) {
        Promise.all(
          emailNotifications.map((n) => {
            const user = userMap.get(n.userId);
            if (!user) return Promise.resolve();

            // Respect user preferences
            const prefs = (user.notificationPrefs as Record<string, unknown>) || {};
            if (prefs.email === false) return Promise.resolve();

            const lang = user.preferredLang || "en";
            const template = getEmailTemplate(n.event, lang, {
              userName: user.name,
              ...n.data,
            });

            return sendEmail({
              to: user.email,
              subject: template.subject,
              html: template.html,
            }).catch((err) => {
              console.error(`[NOTIFY] Email failed for ${n.event} to ${user.email}:`, err);
            });
          })
        ).catch(() => {});
      }

      // Push dispatch (fire-and-forget per user, respecting preferences)
      const pushNotifications = needsExternal.filter(
        (n) => !n.channels || n.channels.includes("push")
      );
      for (const n of pushNotifications) {
        const user = userMap.get(n.userId);
        const prefs = (user?.notificationPrefs as Record<string, unknown>) || {};
        if (prefs.push === false) continue;

        sendPushToUser(n.userId, {
          title: n.title,
          body: n.body,
          data: {
            event: n.event,
            ...(n.data
              ? Object.fromEntries(
                  Object.entries(n.data).map(([k, v]) => [k, String(v)])
                )
              : {}),
          },
          link: n.link,
        }).catch((err) => {
          console.error(`[NOTIFY] Push failed for ${n.event}:`, err);
        });
      }
    }
  } catch (error) {
    console.error("[NOTIFY] Batch notification failed:", error);
  }
}
