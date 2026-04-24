import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkKycApproved } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { commoditySubmissionSchema } from "@/lib/validations";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { notifyMany } from "@/lib/notifications";

// GET /api/commodity-submissions — List submissions (farmer sees own, seller sees approved, admin sees all)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const commodityType = searchParams.get("commodityType");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (authResult.role === "FARMER" || authResult.role === "AGGREGATOR") {
      // Farmers and aggregators only see their own submissions
      where.farmerId = authResult.userId;
    } else if (authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Additional filters
    if (status) {
      where.status = status;
    }
    if (commodityType) {
      where.commodityType = commodityType;
    }

    const [submissions, total] = await Promise.all([
      prisma.commoditySubmission.findMany({
        where,
        include: {
          farmer: { select: { id: true, name: true, country: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.commoditySubmission.count({ where }),
    ]);

    // Fetch related lot info for submissions that have lotId
    const lotIds = submissions.map((s) => s.lotId).filter((id): id is string => !!id);
    const lotsMap = new Map<string, { id: string; lotNumber: string; status: string; auctionEndsAt: Date | null; bidCount: number }>();
    if (lotIds.length > 0) {
      const lots = await prisma.lot.findMany({
        where: { id: { in: lotIds } },
        select: { id: true, lotNumber: true, status: true, auctionEndsAt: true, _count: { select: { bids: true } } },
      });
      for (const lot of lots) {
        lotsMap.set(lot.id, { id: lot.id, lotNumber: lot.lotNumber, status: lot.status, auctionEndsAt: lot.auctionEndsAt, bidCount: lot._count.bids });
      }
    }

    return NextResponse.json({
      submissions: await Promise.all(submissions.map(async (s) => ({
        id: s.id,
        farmerId: s.farmerId,
        farmer: s.farmer,
        commodityType: s.commodityType,
        grade: s.grade,
        variety: s.variety,
        quantityKg: Number(s.quantityKg),
        numberOfBags: s.numberOfBags,
        bagWeight: s.bagWeight,
        packagingType: s.packagingType,
        description: s.description,
        images: s.images,
        videos: s.videos,
        thumbnailUrl: s.images.length > 0 ? await getDownloadPresignedUrl(s.images[0]) : null,
        origin: s.origin,
        harvestDate: s.harvestDate,
        harvestYear: s.harvestYear,
        harvestMonth: s.harvestMonth,
        harvestSeason: s.harvestSeason,
        moistureRange: s.moistureRange,
        colourAroma: s.colourAroma,
        tailCut: s.tailCut,
        sellerDeclaration: s.sellerDeclaration,
        labReportUrl: s.labReportUrl,
        phytosanitaryUrl: s.phytosanitaryUrl,
        originCertUrl: s.originCertUrl,
        status: s.status,
        adminRemarks: s.adminRemarks,
        lotId: s.lotId,
        lot: s.lotId ? lotsMap.get(s.lotId) ?? null : null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[SUBMISSIONS_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/commodity-submissions — Farmer or Aggregator submits commodity details
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = checkRole(authResult, ["FARMER", "AGGREGATOR"]);
  if (roleCheck) return roleCheck;

  const kycCheck = checkKycApproved(authResult);
  if (kycCheck) return kycCheck;

  try {
    const body = await req.json();
    const parsed = commoditySubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const submission = await prisma.$transaction(async (tx) => {
      const newSubmission = await tx.commoditySubmission.create({
        data: {
          farmerId: authResult.userId,
          commodityType: data.commodityType,
          grade: data.grade || null,
          variety: data.variety || null,
          quantityKg: data.quantityKg,
          numberOfBags: data.numberOfBags || null,
          bagWeight: data.bagWeight || null,
          packagingType: data.packagingType || null,
          description: data.description || null,
          images: [],
          videos: [],
          origin: data.origin,
          harvestDate: data.harvestDate ? new Date(data.harvestDate) : null,
          harvestYear: data.harvestYear || null,
          harvestMonth: data.harvestMonth || null,
          harvestSeason: data.harvestSeason || null,
          moistureRange: data.moistureRange || null,
          colourAroma: data.colourAroma || null,
          tailCut: data.tailCut || null,
          sellerDeclaration: data.sellerDeclaration || null,
          status: "SUBMITTED",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: authResult.userId,
          action: "COMMODITY_SUBMITTED",
          entity: "CommoditySubmission",
          entityId: newSubmission.id,
          metadata: {
            commodityType: data.commodityType,
            grade: data.grade,
            quantityKg: data.quantityKg,
          },
        },
      });

      return newSubmission;
    });

    // Notify admins about new submission — use a dedicated event so admins get a
    // clear subject line and rich body with all the key facts.
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    if (admins.length > 0) {
      const farmer = await prisma.user.findUnique({
        where: { id: authResult.userId },
        select: { name: true },
      });
      const commodityLabel = data.commodityType
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const originLocation = [data.origin.district, data.origin.state, data.origin.country]
        .filter(Boolean)
        .join(", ");
      await notifyMany(
        admins.map((admin) => ({
          userId: admin.id,
          event: "NEW_SUBMISSION_ADMIN" as const,
          title: `New Commodity Submission: ${commodityLabel}`,
          body: `${farmer?.name ?? "A farmer"} submitted ${commodityLabel} (${data.quantityKg} kg) for review.`,
          data: {
            submissionId: submission.id,
            commodityLabel,
            quantityKg: data.quantityKg,
            grade: data.grade || "Ungraded",
            farmerName: farmer?.name ?? "A farmer",
            originLocation: originLocation || "—",
          },
          link: `/admin/submissions`,
        }))
      );
    }

    return NextResponse.json(
      {
        submission: {
          ...submission,
          quantityKg: Number(submission.quantityKg),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SUBMISSION_CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
