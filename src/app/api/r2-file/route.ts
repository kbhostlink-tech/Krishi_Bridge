import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

const ALLOWED_PREFIXES = [
  "submission-images/",
  "submission-videos/",
  "kyc-documents/",
  "lot-images/",
  "lot-videos/",
];

function isKeyAllowed(key: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function getContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    pdf: "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  // Prevent path traversal attacks
  const normalized = path.normalize(key).replace(/\\/g, "/");
  if (normalized.includes("..") || !isKeyAllowed(normalized)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // In production, redirect to presigned R2 URL
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
    const { getDownloadPresignedUrl } = await import("@/lib/r2");
    const url = await getDownloadPresignedUrl(normalized);
    return NextResponse.redirect(url, { status: 302 });
  }

  // Dev mode: serve from local uploads directory
  const filePath = path.join(process.cwd(), "uploads", normalized);

  try {
    const buffer = await readFile(filePath);
    const contentType = getContentType(normalized);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
