import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/notifications/unread-count — Get unread notification count (for bell badge)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const count = await prisma.notification.count({
      where: { userId: authResult.userId, isRead: false },
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error("[UNREAD_COUNT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

