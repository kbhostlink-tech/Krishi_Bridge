import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, buildR2Key } from "@/lib/r2";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 8;

// POST /api/commodity-submissions/[submissionId]/images — Upload submission images
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { submissionId } = await params;

  try {
    const submission = await prisma.commoditySubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, farmerId: true, images: true, status: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Only farmer owner or admin can upload
    if (submission.farmerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Lock once approved/listed — only admin may still add/replace media
    if (
      !["SUBMITTED", "REJECTED"].includes(submission.status) &&
      authResult.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "This submission has already been approved or listed and can no longer be edited. Please contact an admin if changes are required.",
        },
        { status: 403 }
      );
    }

    if (submission.images.length >= MAX_IMAGES) {
      return NextResponse.json({ error: `Maximum ${MAX_IMAGES} images allowed` }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP images allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = buildR2Key("submission-images", submissionId, sanitizedName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    await prisma.commoditySubmission.update({
      where: { id: submissionId },
      data: { images: { push: key } },
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("[SUBMISSION_IMAGE_UPLOAD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
