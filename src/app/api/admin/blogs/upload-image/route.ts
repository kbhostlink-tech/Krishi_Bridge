import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRole, checkAdminRole } from "@/lib/auth";
import { uploadToR2, buildR2Key, getDownloadPresignedUrl } from "@/lib/r2";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

// POST /api/admin/blogs/upload-image — upload an image for blog content or cover
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const roleCheck = checkRole(authResult, ["ADMIN"]);
  if (roleCheck instanceof NextResponse) return roleCheck;
  const adminCheck = checkAdminRole(authResult, ["SUPER_ADMIN"]);
  if (adminCheck) return adminCheck;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = buildR2Key("blog-images", authResult.userId, sanitizedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    const url = await getDownloadPresignedUrl(key);
    const stableUrl = `/api/r2-file?key=${encodeURIComponent(key)}`;

    return NextResponse.json({ key, url: stableUrl, previewUrl: url }, { status: 201 });
  } catch (error) {
    console.error("[BLOG_IMAGE_UPLOAD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
