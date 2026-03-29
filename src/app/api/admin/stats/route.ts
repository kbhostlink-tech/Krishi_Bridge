import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;

  try {
    const [totalUsers, pendingKyc, activeLots, totalTransactions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { kycStatus: "PENDING" } }),
      prisma.lot.count({ where: { status: "LISTED" } }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      pendingKyc,
      activeLots,
      totalTransactions,
    });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
