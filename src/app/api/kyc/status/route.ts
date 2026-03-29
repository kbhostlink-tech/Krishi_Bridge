import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { z } from "zod";

// GET /api/kyc/status — fetch current user's KYC status + documents
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { kycStatus: true },
    });

    const documents = await prisma.kycDocument.findMany({
      where: { userId: authResult.userId },
      select: {
        id: true,
        docType: true,
        docUrl: true,
        remarks: true,
        verifiedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate signed URLs for viewing documents
    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        viewUrl: await getDownloadPresignedUrl(doc.docUrl, 3600),
      }))
    );

    return NextResponse.json({
      kycStatus: user?.kycStatus || "PENDING",
      documents: docsWithUrls,
    });
  } catch (error) {
    console.error("[KYC_STATUS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const submitDocSchema = z.object({
  docType: z.string().min(1),
  docUrl: z.string().min(1), // The R2 key
});

// POST /api/kyc/status — submit a document record (after upload to R2 completes)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = submitDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { docType, docUrl } = parsed.data;

    // Create KYC document record
    const doc = await prisma.kycDocument.create({
      data: {
        userId: authResult.userId,
        docType,
        docUrl,
      },
    });

    // If user's kycStatus is still PENDING, move to UNDER_REVIEW
    await prisma.user.update({
      where: { id: authResult.userId },
      data: { kycStatus: "UNDER_REVIEW" },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("[KYC_SUBMIT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
