import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { getBlogRenderExtensions } from "./editor-extensions";
import { normalizeBlogContent } from "@/lib/blog-content";
import "./blog-content.css";

type BlogContentProps = {
  content: Record<string, unknown>;
  className?: string;
};

export function BlogContent({ content, className }: BlogContentProps) {
  const normalized = normalizeBlogContent(content);
  const extensions = getBlogRenderExtensions();
  const html = generateHTML(normalized as JSONContent, extensions);

  return (
    <article
      className={className ? `blog-prose ${className}` : "blog-prose"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
