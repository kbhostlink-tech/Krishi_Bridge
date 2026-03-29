import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/warehouse/invitation?token=xxx — public endpoint, no auth required
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`invitation:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token || typeof token !== "string" || token.length > 100) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invitation = await prisma.warehouseInvitation.findUnique({
    where: { token },
    include: {
      warehouse: {
        select: { id: true, name: true, country: true, state: true, district: true },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 });
  }

  const inviter = await prisma.user.findUnique({
    where: { id: invitation.invitedBy },
    select: { name: true },
  });

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      email: invitation.email,
      staffRole: invitation.staffRole,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      isExpired: invitation.expiresAt < new Date(),
      isAccepted: !!invitation.acceptedAt,
      warehouse: invitation.warehouse,
      inviterName: inviter?.name || "AgriExchange Admin",
    },
  });
}
