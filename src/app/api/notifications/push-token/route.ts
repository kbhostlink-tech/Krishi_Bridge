import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const pushTokenSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(["web", "android", "ios"]).default("web"),
});

// POST /api/notifications/push-token — Register or update FCM push token
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = pushTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid push token", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, platform } = parsed.data;

    // Upsert: if token exists for another user, reassign it (device changed user)
    // If token exists for this user, do nothing (idempotent)
    await prisma.pushSubscription.upsert({
      where: { token },
      create: {
        userId: authResult.userId,
        token,
        platform,
      },
      update: {
        userId: authResult.userId,
        platform,
      },
    });

    return NextResponse.json({ message: "Push token registered" });
  } catch (error) {
    console.error("[PUSH_TOKEN_REGISTER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notifications/push-token — Unregister push token (opt out)
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token : null;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { token, userId: authResult.userId },
    });

    return NextResponse.json({ message: "Push token removed" });
  } catch (error) {
    console.error("[PUSH_TOKEN_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

