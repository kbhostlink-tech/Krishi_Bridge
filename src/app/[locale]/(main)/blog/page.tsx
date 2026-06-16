import type { Metadata } from "next";
import { BlogListingClient } from "@/components/blog/blog-listing-client";
import { getBlogPageCopy } from "@/lib/blog-page-content";
import { normalizeLocale } from "@/lib/public-page-content-v2";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = getBlogPageCopy(normalizeLocale(locale));

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

export default function BlogListingPage() {
  return <BlogListingClient />;
}
