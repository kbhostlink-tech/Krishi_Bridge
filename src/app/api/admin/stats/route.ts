import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN", "SUPER_ADMIN"] as UserRole[]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "dashboard.view");
  if (permErr) return permErr;

  try {
    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last24h = new Date(nowMs - dayMs);
    const last7d = new Date(nowMs - 7 * dayMs);
    const last30d = new Date(nowMs - 30 * dayMs);

    const [
      totalUsers,
      usersLast7d,
      usersByRole,
      pendingKyc,
      underReviewKyc,
      approvedKyc,
      rejectedKyc,
      totalLots,
      activeLots,
      auctionActiveLots,
      soldLots,
      redeemedLots,
      pendingLotApproval,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      transactionsLast24h,
      openRfqs,
      acceptedRfqs,
      totalWarehouses,
      activeWarehouses,
      openDisputes,
      pendingSubmissions,
      revenueAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count({ where: { kycStatus: "PENDING" } }),
      prisma.user.count({ where: { kycStatus: "UNDER_REVIEW" } }),
      prisma.user.count({ where: { kycStatus: "APPROVED" } }),
      prisma.user.count({ where: { kycStatus: "REJECTED" } }),
      prisma.lot.count(),
      prisma.lot.count({ where: { status: "LISTED" } }),
      prisma.lot.count({ where: { status: "AUCTION_ACTIVE" } }),
      prisma.lot.count({ where: { status: "SOLD" } }),
      prisma.lot.count({ where: { status: "REDEEMED" } }),
      prisma.lot.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { createdAt: { gte: last24h } } }),
      prisma.rfqRequest.count({ where: { status: { in: ["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING"] } } }),
      prisma.rfqRequest.count({ where: { status: "ACCEPTED" } }),
      prisma.warehouse.count().catch(() => 0),
      prisma.warehouse.count({ where: { isActive: true } }).catch(() => 0),
      Promise.resolve(0),
      prisma.commoditySubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }).catch(() => 0),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: last30d } },
        _sum: { grossAmount: true, commissionAmount: true },
      }).catch(() => ({ _sum: { grossAmount: null, commissionAmount: null } })),
    ]);

    return NextResponse.json({
      totalUsers,
      usersLast7d,
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
      kyc: {
        pending: pendingKyc,
        underReview: underReviewKyc,
        approved: approvedKyc,
        rejected: rejectedKyc,
      },
      lots: {
        total: totalLots,
        listed: activeLots,
        auctionActive: auctionActiveLots,
        sold: soldLots,
        redeemed: redeemedLots,
        pendingApproval: pendingLotApproval,
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions,
        pending: pendingTransactions,
        last24h: transactionsLast24h,
      },
      rfqs: {
        open: openRfqs,
        accepted: acceptedRfqs,
      },
      warehouses: {
        total: totalWarehouses,
        active: activeWarehouses,
      },
      disputes: { open: openDisputes },
      submissions: { pending: pendingSubmissions },
      revenue30d: {
        gross: Number(revenueAgg._sum.grossAmount ?? 0),
        commission: Number(revenueAgg._sum.commissionAmount ?? 0),
      },
      // Legacy flat fields for backward compatibility with existing UI
      pendingKyc,
      activeLots,
      totalTransactions: completedTransactions,
    });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
