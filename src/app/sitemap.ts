import type { MetadataRoute } from "next";
import { PUBLIC_INFO_PAGE_SLUGS } from "../lib/public-page-content-v2";
import { prisma } from "../lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";
const LOCALES = ["en", "hi", "ne", "dz", "ar"] as const;

/**
 * Public, crawlable routes. Keep this list tight — never list authenticated
 * or role-gated surfaces here, otherwise Google wastes crawl budget and
 * reports soft-404s when hit by Googlebot without a session.
 */
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/blog",
  "/contact",
  "/marketplace",
  ...PUBLIC_INFO_PAGE_SLUGS.map((slug) => `/${slug}`),
];

function getRoutePriority(route: string) {
  if (route === "") return 1.0;
  if (route === "/marketplace") return 0.85;
  if (route === "/about" || route === "/contact" || route === "/blog") return 0.75;
  if (route.startsWith("/blog/")) return 0.65;
  return 0.55;
}

function getChangeFrequency(route: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (route === "") return "daily";
  if (route === "/marketplace") return "daily";
  if (route.startsWith("/blog/")) return "weekly";
  if (route === "/about" || route === "/contact" || route === "/blog") return "monthly";
  return "yearly";
}

function pushLocalizedRoutes(
  entries: MetadataRoute.Sitemap,
  route: string,
  lastModified: Date
) {
  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}/${locale}${route}`,
      lastModified,
      changeFrequency: getChangeFrequency(route),
      priority:
        locale === "en" ? getRoutePriority(route) : Math.max(getRoutePriority(route) - 0.2, 0.35),
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((lang) => [lang, `${SITE_URL}/${lang}${route}`])
        ),
      },
    });
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    pushLocalizedRoutes(entries, route || "", now);
  }

  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  for (const post of posts) {
    pushLocalizedRoutes(
      entries,
      `/blog/${post.slug}`,
      post.updatedAt ?? post.publishedAt ?? now
    );
  }

  return entries;
}
