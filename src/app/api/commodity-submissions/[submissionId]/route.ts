import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { commoditySubmissionUpdateSchema } from "@/lib/validations";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { notifyUser } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ submissionId: string }>;
}

// GET /api/commodity-submissions/[submissionId] — Get submission detail
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { submissionId } = await params;

  try {
    const submission = await prisma.commoditySubmission.findUnique({
      where: { id: submissionId },
      include: {
        farmer: { select: { id: true, name: true, country: true, email: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Access control: farmer/aggregator sees own, admin sees all
    if ((authResult.role === "FARMER" || authResult.role === "AGGREGATOR") && submission.farmerId !== authResult.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (!["FARMER", "AGGREGATOR", "ADMIN"].includes(authResult.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const [imageUrls, videoUrls] = await Promise.all([
      Promise.all(submission.images.map((key) => getDownloadPresignedUrl(key))),
      Promise.all(submission.videos.map((key) => getDownloadPresignedUrl(key))),
    ]);

    return NextResponse.json({
      submission: {
        ...submission,
        quantityKg: Number(submission.quantityKg),
        imageUrls,
        videoUrls,
      },
    });
  } catch (error) {
    console.error("[SUBMISSION_DETAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/commodity-submissions/[submissionId] — Farmer updates or Admin reviews
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { submissionId } = await params;

  try {
    const submission = await prisma.commoditySubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const body = await req.json();

    // Admin review action
    if (authResult.role === "ADMIN" && body.action) {
      const { action, adminRemarks } = body;

      if (!["approve", "reject", "review"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      const statusMap: Record<string, string> = {
        approve: "APPROVED",
        reject: "REJECTED",
        review: "UNDER_REVIEW",
      };

      const updated = await prisma.$transaction(async (tx) => {
        const updatedSubmission = await tx.commoditySubmission.update({
          where: { id: submissionId },
          data: {
            status: statusMap[action] as "APPROVED" | "REJECTED" | "UNDER_REVIEW",
            adminRemarks: adminRemarks || null,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: authResult.userId,
            action: `SUBMISSION_${action.toUpperCase()}`,
            entity: "CommoditySubmission",
            entityId: submissionId,
            metadata: { previousStatus: submission.status, newStatus: statusMap[action], adminRemarks },
          },
        });

        return updatedSubmission;
      });

      // Notify farmer about status change
      await notifyUser({
        userId: submission.farmerId,
        event: "LOT_STATUS_CHANGE" as const,
        title: action === "approve"
          ? "✅ Commodity Submission Approved"
          : action === "reject"
          ? "❌ Commodity Submission Rejected"
          : "🔍 Commodity Submission Under Review",
        body: action === "approve"
          ? "Your commodity submission has been approved! You can now proceed to create a lot listing from your dashboard."
          : action === "reject"
          ? `Your commodity submission has been rejected. ${adminRemarks ? `Reason: ${adminRemarks}` : "Please review and resubmit."}`
          : "Your commodity submission is now under review. You will be notified once a decision is made.",
        data: { submissionId, action },
      });

      return NextResponse.json({
        submission: { ...updated, quantityKg: Number(updated.quantityKg) },
      });
    }

    // Farmer update (only if SUBMITTED or REJECTED)
    if (authResult.role === "FARMER") {
      if (submission.farmerId !== authResult.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      if (!["SUBMITTED", "REJECTED"].includes(submission.status)) {
        return NextResponse.json(
          { error: "Can only edit submissions in SUBMITTED or REJECTED status" },
          { status: 400 }
        );
      }

      const parsed = commoditySubmissionUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { status: "SUBMITTED" }; // Re-submit after edit
      if (parsed.data.commodityType) updateData.commodityType = parsed.data.commodityType;
      if (parsed.data.grade !== undefined) updateData.grade = parsed.data.grade;
      if (parsed.data.variety !== undefined) updateData.variety = parsed.data.variety || null;
      if (parsed.data.quantityKg) updateData.quantityKg = parsed.data.quantityKg;
      if (parsed.data.numberOfBags !== undefined) updateData.numberOfBags = parsed.data.numberOfBags ?? null;
      if (parsed.data.bagWeight !== undefined) updateData.bagWeight = parsed.data.bagWeight ?? null;
      if (parsed.data.packagingType !== undefined) updateData.packagingType = parsed.data.packagingType || null;
      if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
      if (parsed.data.origin) updateData.origin = parsed.data.origin;
      if (parsed.data.harvestDate) updateData.harvestDate = new Date(parsed.data.harvestDate);
      if (parsed.data.harvestYear !== undefined) updateData.harvestYear = parsed.data.harvestYear ?? null;
      if (parsed.data.harvestMonth !== undefined) updateData.harvestMonth = parsed.data.harvestMonth || null;
      if (parsed.data.harvestSeason !== undefined) updateData.harvestSeason = parsed.data.harvestSeason;
      if (parsed.data.moistureRange !== undefined) updateData.moistureRange = parsed.data.moistureRange || null;
      if (parsed.data.colourAroma !== undefined) updateData.colourAroma = parsed.data.colourAroma || null;
      if (parsed.data.tailCut !== undefined) updateData.tailCut = parsed.data.tailCut || null;
      if (parsed.data.sellerDeclaration !== undefined) updateData.sellerDeclaration = parsed.data.sellerDeclaration || null;

      const updated = await prisma.commoditySubmission.update({
        where: { id: submissionId },
        data: updateData,
      });

      return NextResponse.json({
        submission: { ...updated, quantityKg: Number(updated.quantityKg) },
      });
    }

    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  } catch (error) {
    console.error("[SUBMISSION_UPDATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
