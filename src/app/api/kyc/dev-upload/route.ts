import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Dev-only endpoint that simulates R2 uploads by writing to local filesystem.
 * Only active when R2 environment variables are not configured.
 */
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const contentType = searchParams.get("contentType");

  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  try {
    const body = await req.arrayBuffer();
    const buffer = Buffer.from(body);

    // Store in a local uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads", path.dirname(key));
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(process.cwd(), "uploads", key);
    await writeFile(filePath, buffer);

    console.log(`[DEV_UPLOAD] Saved file: uploads/${key} (${buffer.length} bytes, ${contentType})`);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[DEV_UPLOAD]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  try {
    const { readFile } = await import("fs/promises");
    const filePath = path.join(process.cwd(), "uploads", key);
    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

