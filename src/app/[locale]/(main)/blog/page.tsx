import type { Metadata } from "next";
import { BlogListingClient } from "@/components/blog/blog-listing-client";

export const metadata: Metadata = {
  title: "Blog | Krishibridge",
  description: "Insights on agricultural trade, commodity markets, and platform updates from Krishibridge.",
};

export default function BlogListingPage() {
  return <BlogListingClient />;
}
