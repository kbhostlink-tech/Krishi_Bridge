import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, buildR2Key } from "@/lib/r2";

const ALLOWED_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_VIDEOS = 4;

// POST /api/lots/[lotId]/videos — Upload lot video
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { lotId } = await params;

  try {
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, sellerId: true, videos: true, status: true },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Only lot owner (seller) or admin can upload videos
    if (
      lot.sellerId !== authResult.userId &&
      authResult.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (lot.videos.length >= MAX_VIDEOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VIDEOS} videos allowed` },
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
      return NextResponse.json(
        { error: "Video must be under 100MB" },
        { status: 400 }
      );
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = buildR2Key("lot-videos", lotId, sanitizedName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    // Append video key to lot
    await prisma.lot.update({
      where: { id: lotId },
      data: { videos: { push: key } },
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("[LOT_VIDEO_UPLOAD]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
