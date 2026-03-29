import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, buildR2Key } from "@/lib/r2";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 8;

// POST /api/lots/[lotId]/images — Upload lot images
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { lotId } = await params;

  try {
    // Verify lot exists and user has permission
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, farmerId: true, images: true, status: true },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    // Only lot owner, warehouse staff, or admin can upload images
    if (
      lot.farmerId !== authResult.userId &&
      authResult.role !== "ADMIN" &&
      authResult.role !== "WAREHOUSE_STAFF"
    ) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (lot.images.length >= MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed` },
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
        { error: "Only JPEG, PNG, WebP images allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = buildR2Key("lot-images", lotId, sanitizedName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    // Append image key to lot
    await prisma.lot.update({
      where: { id: lotId },
      data: { images: { push: key } },
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("[LOT_IMAGE_UPLOAD]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
