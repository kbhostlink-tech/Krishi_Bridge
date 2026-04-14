import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// GET /api/admin/stats/analytics — Extended analytics for dashboard charts
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "analytics.view");
  if (permErr) return permErr;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      pendingKyc,
      approvedKyc,
      rejectedKyc,
      activeLots,
      pendingApprovalLots,
      auctionActiveLots,
      soldLots,
      totalTransactions,
      escrowHeldTransactions,
      completedTransactions,
      failedTransactions,
      totalRfqs,
      openRfqs,
      acceptedRfqs,
      usersByRole,
      usersByCountry,
      recentUsers,
      recentTransactions,
      lotsByCommodity,
      transactionAggregates,
      escrowAggregates,
    ] = await Promise.all([
      // Counts
      prisma.user.count(),
      prisma.user.count({ where: { kycStatus: "PENDING" } }),
      prisma.user.count({ where: { kycStatus: "APPROVED" } }),
      prisma.user.count({ where: { kycStatus: "REJECTED" } }),
      prisma.lot.count({ where: { status: "LISTED" } }),
      prisma.lot.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.lot.count({ where: { status: "AUCTION_ACTIVE" } }),
      prisma.lot.count({ where: { status: "SOLD" } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "ESCROW_HELD" } }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.transaction.count({ where: { status: "FAILED" } }),
      prisma.rfqRequest.count(),
      prisma.rfqRequest.count({ where: { status: { in: ["OPEN", "ROUTED", "RESPONDED", "NEGOTIATING"] } } }),
      prisma.rfqRequest.count({ where: { status: "ACCEPTED" } }),

      // Group by
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.user.groupBy({ by: ["country"], _count: true, orderBy: { _count: { country: "desc" } }, take: 10 }),

      // Recent 30 days registrations grouped by day
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as Promise<Array<{ date: Date; count: number }>>,

      // Recent 30 days transactions grouped by day
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count, SUM("grossAmount")::float as volume
        FROM "Transaction"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as Promise<Array<{ date: Date; count: number; volume: number }>>,

      // Lots by commodity type
      prisma.lot.groupBy({ by: ["commodityType"], _count: true, orderBy: { _count: { commodityType: "desc" } }, take: 10 }),

      // Total transaction volume
      prisma.transaction.aggregate({
        _sum: { grossAmount: true, commissionAmount: true, netToSeller: true },
        where: { status: { in: ["COMPLETED", "ESCROW_HELD"] } },
      }),

      // Escrow held volume
      prisma.transaction.aggregate({
        _sum: { grossAmount: true },
        where: { status: "ESCROW_HELD" },
      }),
    ]);

    return NextResponse.json({
      summary: {
        totalUsers,
        pendingKyc,
        approvedKyc,
        rejectedKyc,
        activeLots,
        pendingApprovalLots,
        auctionActiveLots,
        soldLots,
        totalTransactions,
        escrowHeldTransactions,
        completedTransactions,
        failedTransactions,
        totalRfqs,
        openRfqs,
        acceptedRfqs,
      },
      financials: {
        totalVolume: Number(transactionAggregates._sum.grossAmount ?? 0),
        totalCommission: Number(transactionAggregates._sum.commissionAmount ?? 0),
        totalNetToSeller: Number(transactionAggregates._sum.netToSeller ?? 0),
        escrowHeldAmount: Number(escrowAggregates._sum.grossAmount ?? 0),
      },
      charts: {
        usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
        usersByCountry: usersByCountry.map((c) => ({ country: c.country, count: c._count })),
        lotsByCommodity: lotsByCommodity.map((l) => ({ commodity: l.commodityType, count: l._count })),
        recentUsers: (recentUsers as Array<{ date: Date; count: number }>).map((r) => ({
          date: new Date(r.date).toISOString().split("T")[0],
          count: r.count,
        })),
        recentTransactions: (recentTransactions as Array<{ date: Date; count: number; volume: number }>).map((t) => ({
          date: new Date(t.date).toISOString().split("T")[0],
          count: t.count,
          volume: Math.round((t.volume || 0) * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error("[ADMIN_ANALYTICS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
