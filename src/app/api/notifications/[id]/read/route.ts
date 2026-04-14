import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PATCH /api/notifications/[id]/read — Mark a single notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, isRead: true },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Ownership check — users can only mark their own notifications
    if (notification.userId !== authResult.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (notification.isRead) {
      return NextResponse.json({ message: "Already read" });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "Marked as read" });
  } catch (error) {
    console.error("[NOTIFICATION_READ]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
