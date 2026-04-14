import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const isR2Configured = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);

const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/**
 * Generate a pre-signed URL for uploading a file directly to R2.
 * Client uploads directly to this URL — no server passthrough.
 * In dev mode without R2, returns a local API endpoint for file upload.
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  if (!r2Client || !R2_BUCKET_NAME) {
    // Dev mode: return a local upload endpoint
    console.log(`[R2_DEV] Upload pre-signed URL requested for key: ${key} (R2 not configured)`);
    return `/api/kyc/dev-upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
  }
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a pre-signed URL for downloading/viewing a file from R2.
 * Default 1-hour expiry for KYC document viewing.
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (!r2Client || !R2_BUCKET_NAME) {
    // Dev mode: serve from local uploads directory
    console.log(`[R2_DEV] Download pre-signed URL requested for key: ${key} (R2 not configured)`);
    return `/api/r2-file?key=${encodeURIComponent(key)}`;
  }
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Upload a file buffer directly to R2 (server-side, no CORS issues).
 * Use this instead of pre-signed PUT URLs to avoid browser CORS restrictions.
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  if (!r2Client || !R2_BUCKET_NAME) {
    // Dev mode: save to local filesystem
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.default.join(process.cwd(), "uploads", path.default.dirname(key));
    await mkdir(dir, { recursive: true });
    await writeFile(path.default.join(process.cwd(), "uploads", key), buffer);
    console.log(`[R2_DEV] Saved locally: uploads/${key} (${buffer.length} bytes)`);
    return;
  }
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

/**
 * Build the R2 object key for different file types.
 */
export function buildR2Key(
  type: "kyc" | "lot-images" | "lot-videos" | "qr-codes" | "quality-reports" | "submission-images" | "submission-videos",
  userId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  return `${type}/${userId}/${timestamp}-${fileName}`;
}
