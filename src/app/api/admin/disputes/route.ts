import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// GET /api/admin/disputes — Flagged/failed transactions as dispute queue
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "transactions.view");
  if (permErr) return permErr;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // FAILED, REFUNDED, ESCROW_HELD
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  try {
    const where: Record<string, unknown> = {
      status: { in: status ? [status] : ["FAILED", "REFUNDED", "ESCROW_HELD"] },
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          lot: { select: { lotNumber: true, commodityType: true, grade: true, seller: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // For each transaction, get related audit logs
    const txIds = transactions.map((t) => t.id);
    const auditLogs = txIds.length > 0
      ? await prisma.auditLog.findMany({
          where: { entity: "Transaction", entityId: { in: txIds } },
          orderBy: { createdAt: "desc" },
          select: { id: true, action: true, entityId: true, userId: true, createdAt: true },
        })
      : [];

    const logsByTx = auditLogs.reduce<Record<string, typeof auditLogs>>((acc, log) => {
      const key = log.entityId || "";
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});

    const mapped = transactions.map((t) => ({
      id: t.id,
      lotNumber: t.lot?.lotNumber || null,
      commodityType: t.lot?.commodityType || null,
      grade: t.lot?.grade || null,
      buyer: t.buyer ? { id: t.buyer.id, name: t.buyer.name, email: t.buyer.email } : null,
      seller: t.lot?.seller ? { id: t.lot.seller.id, name: t.lot.seller.name, email: t.lot.seller.email } : null,
      grossAmount: Number(t.grossAmount),
      commissionAmount: Number(t.commissionAmount),
      netToSeller: Number(t.netToSeller),
      currency: t.currency,
      paymentMethod: t.paymentMethod,
      status: t.status,
      gatewayOrderId: t.gatewayOrderId,
      paidAt: t.paidAt,
      escrowReleasedAt: t.escrowReleasedAt,
      createdAt: t.createdAt,
      auditLogs: logsByTx[t.id] || [],
    }));

    return NextResponse.json({
      disputes: mapped,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ADMIN_DISPUTES]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/disputes — Add resolution note (creates audit log)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "escrow.release");
  if (permErr) return permErr;

  try {
    const body = await req.json();
    const { transactionId, action, note } = body;

    if (!transactionId || !action || !note) {
      return NextResponse.json({ error: "transactionId, action, and note are required" }, { status: 400 });
    }

    if (typeof note !== "string" || note.length > 2000) {
      return NextResponse.json({ error: "Note must be a string under 2000 characters" }, { status: 400 });
    }

    const validActions = ["RESOLUTION_NOTE", "ESCALATED", "REFUND_APPROVED", "DISPUTE_CLOSED"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be: ${validActions.join(", ")}` }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: authResult.userId,
        action: `DISPUTE_${action}`,
        entity: "Transaction",
        entityId: transactionId,
        metadata: { note, adminId: authResult.userId },
      },
    });

    return NextResponse.json({ success: true, auditLog: { id: auditLog.id, action: auditLog.action, createdAt: auditLog.createdAt } });
  } catch (error) {
    console.error("[ADMIN_DISPUTE_NOTE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
