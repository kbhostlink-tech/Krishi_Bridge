import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/r2";

// GET /api/admin/lots — List all lots (ADMIN only)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const permErr = requireAdminPermission(authResult, "lots.view");
  if (permErr) return permErr;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { lotNumber: { contains: search, mode: "insensitive" } },
        { farmer: { name: { contains: search, mode: "insensitive" } } },
        { farmer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [lots, total] = await Promise.all([
      prisma.lot.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true, name: true, email: true, country: true,
              sellerProfile: {
                select: {
                  bankAccountName: true, bankAccountNumber: true,
                  bankName: true, bankBranch: true, bankIfscCode: true,
                },
              },
            },
          },
          farmer: {
            select: {
              id: true, name: true, email: true, country: true,
              sellerProfile: {
                select: {
                  bankAccountName: true, bankAccountNumber: true,
                  bankName: true, bankBranch: true, bankIfscCode: true,
                },
              },
            },
          },
          warehouse: { select: { id: true, name: true } },
          bids: {
            where: { status: "WON" },
            take: 1,
            select: {
              id: true, amountInr: true, status: true,
              bidder: { select: { id: true, name: true, email: true, country: true, uniquePaymentCode: true } },
            },
          },
          transactions: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              id: true, status: true, grossAmount: true, commissionAmount: true,
              netToSeller: true, currency: true, paidAt: true, escrowReleasedAt: true,
              adminConfirmedAt: true, fundsReleasedAt: true, buyerReceivedAt: true,
              createdAt: true,
            },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lot.count({ where }),
    ]);

    const enriched = await Promise.all(
      lots.map(async (lot) => {
        let primaryImageUrl: string | null = null;
        const images = (lot.images as string[]) || [];
        if (images.length > 0) {
          try {
            primaryImageUrl = await getDownloadPresignedUrl(images[0]);
          } catch { /* ignore */ }
        }
        const winningBid = lot.bids[0] || null;
        const transaction = lot.transactions[0] || null;
        return {
          id: lot.id,
          lotNumber: lot.lotNumber,
          commodityType: lot.commodityType,
          grade: lot.grade,
          quantityKg: lot.quantityKg,
          status: lot.status,
          listingMode: lot.listingMode,
          startingPriceInr: lot.startingPriceInr ? Number(lot.startingPriceInr) : null,
          reservePriceInr: lot.reservePriceInr ? Number(lot.reservePriceInr) : null,
          auctionStartsAt: lot.auctionStartsAt?.toISOString() || null,
          auctionEndsAt: lot.auctionEndsAt?.toISOString() || null,
          origin: lot.origin,
          description: lot.description,
          createdAt: lot.createdAt.toISOString(),
          updatedAt: lot.updatedAt.toISOString(),
          seller: lot.seller ? {
            id: lot.seller.id, name: lot.seller.name, email: lot.seller.email,
            country: lot.seller.country,
            bankDetails: lot.seller.sellerProfile ? {
              accountName: lot.seller.sellerProfile.bankAccountName,
              accountNumber: lot.seller.sellerProfile.bankAccountNumber,
              bankName: lot.seller.sellerProfile.bankName,
              branch: lot.seller.sellerProfile.bankBranch,
              ifscCode: lot.seller.sellerProfile.bankIfscCode,
            } : null,
          } : null,
          farmer: lot.farmer ? {
            id: lot.farmer.id, name: lot.farmer.name, email: lot.farmer.email,
            country: lot.farmer.country,
            bankDetails: lot.farmer.sellerProfile ? {
              accountName: lot.farmer.sellerProfile.bankAccountName,
              accountNumber: lot.farmer.sellerProfile.bankAccountNumber,
              bankName: lot.farmer.sellerProfile.bankName,
              branch: lot.farmer.sellerProfile.bankBranch,
              ifscCode: lot.farmer.sellerProfile.bankIfscCode,
            } : null,
          } : null,
          warehouse: lot.warehouse,
          bidCount: lot._count.bids,
          winningBid: winningBid ? {
            id: winningBid.id,
            amountInr: Number(winningBid.amountInr),
            buyer: winningBid.bidder,
          } : null,
          transaction: transaction ? {
            id: transaction.id,
            status: transaction.status,
            grossAmount: Number(transaction.grossAmount),
            commissionAmount: Number(transaction.commissionAmount),
            netToSeller: Number(transaction.netToSeller),
            currency: transaction.currency,
            paidAt: transaction.paidAt?.toISOString() || null,
            adminConfirmedAt: transaction.adminConfirmedAt?.toISOString() || null,
            fundsReleasedAt: transaction.fundsReleasedAt?.toISOString() || null,
            buyerReceivedAt: transaction.buyerReceivedAt?.toISOString() || null,
            createdAt: transaction.createdAt.toISOString(),
          } : null,
          primaryImageUrl,
        };
      })
    );

    return NextResponse.json({ lots: enriched, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[ADMIN_LOTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

