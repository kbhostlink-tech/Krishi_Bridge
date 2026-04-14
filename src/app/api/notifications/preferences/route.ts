import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const prefsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
}).strict();

// GET /api/notifications/preferences — Get notification preferences
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { notificationPrefs: true },
    });

    const defaults = { email: true, push: true, inApp: true, quietHoursStart: null, quietHoursEnd: null };
    const prefs = user?.notificationPrefs
      ? { ...defaults, ...(user.notificationPrefs as Record<string, unknown>) }
      : defaults;

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("[NOTIFICATION_PREFS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications/preferences — Update notification preferences
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = prefsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid preferences", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Merge with existing prefs
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { notificationPrefs: true },
    });

    const existingPrefs = (user?.notificationPrefs as Record<string, unknown>) || {};
    const updatedPrefs = { ...existingPrefs, ...parsed.data };

    await prisma.user.update({
      where: { id: authResult.userId },
      data: { notificationPrefs: updatedPrefs },
    });

    return NextResponse.json({
      message: "Notification preferences updated",
      preferences: updatedPrefs,
    });
  } catch (error) {
    console.error("[NOTIFICATION_PREFS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
