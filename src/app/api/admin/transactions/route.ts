import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// GET /api/admin/transactions — List all transactions with filters
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "transactions.view");
  if (permErr) return permErr;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");
    const search = url.searchParams.get("search");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) where.status = status;
    if (method) where.paymentMethod = method;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { gatewayOrderId: { contains: search, mode: "insensitive" } },
        { gatewayPaymentId: { contains: search, mode: "insensitive" } },
        { buyer: { name: { contains: search, mode: "insensitive" } } },
        { buyer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, email: true, uniquePaymentCode: true } },
          lot: { select: { id: true, lotNumber: true, commodityType: true, seller: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        lotId: t.lotId,
        lotNumber: t.lot?.lotNumber ?? null,
        commodityType: t.lot?.commodityType ?? null,
        rfqId: t.rfqId,
        buyerName: t.buyer.name,
        buyerEmail: t.buyer.email,
        sellerName: t.lot?.seller?.name ?? "N/A",
        sellerId: t.sellerId,
        paymentMethod: t.paymentMethod,
        currency: t.currency,
        grossAmount: Number(t.grossAmount),
        commissionAmount: Number(t.commissionAmount),
        taxOnGoods: Number(t.taxOnGoods),
        taxOnCommission: Number(t.taxOnCommission),
        netToSeller: Number(t.netToSeller),
        status: t.status,
        gatewayOrderId: t.gatewayOrderId,
        gatewayPaymentId: t.gatewayPaymentId,
        paidAt: t.paidAt,
        escrowReleasedAt: t.escrowReleasedAt,
        createdAt: t.createdAt,
        buyerPaymentCode: t.buyer.uniquePaymentCode ?? null,
        adminConfirmedAt: t.adminConfirmedAt ?? null,
        fundsReleasedAt: t.fundsReleasedAt ?? null,
        manualPaymentRef: t.manualPaymentRef ?? null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_TRANSACTIONS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

