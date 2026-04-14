import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, buildR2Key } from "@/lib/r2";

const ALLOWED_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_VIDEOS = 1;

// POST /api/commodity-submissions/[submissionId]/videos — Upload submission video
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
      select: { id: true, farmerId: true, videos: true, status: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.farmerId !== authResult.userId && authResult.role !== "ADMIN") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!["SUBMITTED", "REJECTED"].includes(submission.status)) {
      return NextResponse.json(
        { error: "Can only add videos to editable submissions" },
        { status: 400 }
      );
    }

    if (submission.videos.length >= MAX_VIDEOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VIDEOS} video allowed` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Only MP4, WebM, MOV video formats allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Video must be under 100MB" }, { status: 400 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = buildR2Key("submission-videos", submissionId, sanitizedName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    await prisma.commoditySubmission.update({
      where: { id: submissionId },
      data: { videos: { push: key } },
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("[SUBMISSION_VIDEO_UPLOAD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
