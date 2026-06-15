import { getBlogImageSrc } from "@/lib/blog";

type TipTapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export function normalizeImageSrc(src: string | null | undefined): string {
  if (!src) return "";

  if (src.startsWith("/api/r2-file")) return src;

  try {
    const parsed = new URL(src, "http://local");
    const keyParam = parsed.searchParams.get("key");
    if (keyParam?.startsWith("blog-images/")) {
      return getBlogImageSrc(keyParam) || src;
    }
  } catch {
    // not a valid URL
  }

  const keyMatch = src.match(/blog-images\/[a-zA-Z0-9/_\-%.]+/);
  if (keyMatch) {
    return getBlogImageSrc(keyMatch[0]) || src;
  }

  return src;
}

export function normalizeBlogContent(content: unknown): Record<string, unknown> {
  if (!content || typeof content !== "object") {
    return { type: "doc", content: [] };
  }

  const doc = structuredClone(content) as TipTapNode;

  function walk(node: TipTapNode) {
    if (node.type === "image" && node.attrs?.src) {
      const r2Key = node.attrs["data-r2-key"];
      if (typeof r2Key === "string" && r2Key.startsWith("blog-images/")) {
        node.attrs.src = getBlogImageSrc(r2Key) || node.attrs.src;
      } else {
        node.attrs.src = normalizeImageSrc(String(node.attrs.src));
      }
    }
    node.content?.forEach(walk);
  }

  if (!doc.type) doc.type = "doc";
  if (!doc.content) doc.content = [];
  walk(doc);

  return doc as Record<string, unknown>;
}
