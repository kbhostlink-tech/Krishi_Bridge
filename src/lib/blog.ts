import { getDownloadPresignedUrl } from "@/lib/r2";

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "untitled";
}

/** Stable app URL for blog images — supports R2 keys and public paths. */
export function getBlogImageSrc(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("/") || key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  return `/api/r2-file?key=${encodeURIComponent(key)}`;
}

export async function resolveBlogImageUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  return getDownloadPresignedUrl(key);
}

export function enrichBlogPostSync<T extends { coverImage?: string | null }>(
  post: T
): T & { coverImageUrl: string | null } {
  return {
    ...post,
    coverImageUrl: getBlogImageSrc(post.coverImage),
  };
}

export async function enrichBlogPost<T extends { coverImage?: string | null }>(
  post: T
): Promise<T & { coverImageUrl: string | null }> {
  return enrichBlogPostSync(post);
}
