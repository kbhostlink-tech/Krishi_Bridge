import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole, requireAdminPermission } from "@/lib/auth";

// GET /api/admin/users/[userId]/activity — Full user activity view
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck) return roleCheck;
  const permErr = requireAdminPermission(authResult, "users.view");
  if (permErr) return permErr;

  const { userId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        adminRole: true,
        country: true,
        kycStatus: true,
        isActive: true,
        emailVerified: true,
        preferredLang: true,
        createdAt: true,
        updatedAt: true,
        buyerProfile: {
          select: {
            buyerType: true,
            companyName: true,
            tradeName: true,
            fullAddress: true,
            city: true,
            website: true,
            contactDesignation: true,
            alternateContact: true,
            mobile: true,
            registrationNumber: true,
            taxId: true,
            importExportLicense: true,
            yearsInBusiness: true,
            typicalMonthlyVolumeMin: true,
            typicalMonthlyVolumeMax: true,
            preferredOrigins: true,
            preferredGrades: true,
            packagingPreference: true,
          },
        },
        sellerProfile: {
          select: {
            sellerType: true,
            entityName: true,
            contactPersonName: true,
            mobile: true,
            languagePreference: true,
            state: true,
            district: true,
            village: true,
            registrationId: true,
            fpoName: true,
            yearsOfActivity: true,
            typicalAnnualVolume: true,
            originRegion: true,
            harvestSeason: true,
            postHarvestProcess: true,
            minAcceptableQuantity: true,
            willingToNegotiate: true,
            bankAccountName: true,
            bankAccountNumber: true,
            bankName: true,
            bankBranch: true,
            bankIfscCode: true,
          },
        },
        uniquePaymentCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [lots, bids, transactions, tokens, rfqRequests, rfqResponses, auditLogs] = await Promise.all([
      prisma.lot.findMany({
        where: { OR: [{ sellerId: userId }, { farmerId: userId }] },
        select: { id: true, lotNumber: true, commodityType: true, grade: true, status: true, quantityKg: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.bid.findMany({
        where: { bidderId: userId },
        select: {
          id: true, amountInr: true, status: true, createdAt: true,
          lot: { select: { lotNumber: true, commodityType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.transaction.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        select: {
          id: true, grossAmount: true, commissionAmount: true, netToSeller: true,
          status: true, paymentMethod: true, currency: true, createdAt: true,
          lot: { select: { lotNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.token.findMany({
        where: { ownerId: userId },
        select: { id: true, hmacHash: true, status: true, lot: { select: { lotNumber: true, commodityType: true } }, mintedAt: true },
        orderBy: { mintedAt: "desc" },
        take: 20,
      }),
      prisma.rfqRequest.findMany({
        where: { buyerId: userId },
        select: { id: true, commodityType: true, quantityKg: true, status: true, responseCount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.rfqResponse.findMany({
        where: { sellerId: userId },
        select: {
          id: true, status: true, deliveryDays: true, createdAt: true,
          rfq: { select: { commodityType: true, quantityKg: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.auditLog.findMany({
        where: { userId },
        select: { id: true, action: true, entity: true, entityId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      user,
      activity: {
        lots: lots.map((l) => ({ ...l, quantityKg: Number(l.quantityKg) })),
        bids: bids.map((b) => ({ ...b, amountInr: Number(b.amountInr) })),
        transactions: transactions.map((t) => ({
          ...t,
          grossAmount: Number(t.grossAmount),
          commissionAmount: Number(t.commissionAmount),
          netToSeller: Number(t.netToSeller),
        })),
        tokens: tokens.map((t) => ({ ...t, createdAt: t.mintedAt })),
        rfqRequests: rfqRequests.map((r) => ({ ...r, quantityKg: Number(r.quantityKg) })),
        rfqResponses,
        auditLogs,
      },
    });
  } catch (error) {
    console.error("[ADMIN_USER_ACTIVITY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
