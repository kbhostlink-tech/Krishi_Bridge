import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/notifications — List notifications (paginated)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const unreadOnly = searchParams.get("unread") === "true";
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { userId: authResult.userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: authResult.userId, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark all as read
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const result = await prisma.notification.updateMany({
      where: { userId: authResult.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_READ_ALL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
