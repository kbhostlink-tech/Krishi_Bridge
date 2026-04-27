import type { MetadataRoute } from "next";
import { PUBLIC_INFO_PAGE_SLUGS } from "../lib/public-page-content-v2";

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
  "/contact",
  "/marketplace",
  ...PUBLIC_INFO_PAGE_SLUGS.map((slug) => `/${slug}`),
];

function getRoutePriority(route: string) {
  if (route === "") return 1.0;
  if (route === "/marketplace") return 0.85;
  if (route === "/about" || route === "/contact") return 0.75;
  return 0.55;
}

function getChangeFrequency(route: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (route === "") return "daily";
  if (route === "/marketplace") return "daily";
  if (route === "/about" || route === "/contact") return "monthly";
  return "yearly";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${route || ""}`,
        lastModified: now,
        changeFrequency: getChangeFrequency(route),
        priority: locale === "en" ? getRoutePriority(route) : Math.max(getRoutePriority(route) - 0.2, 0.35),
        alternates: {
          languages: Object.fromEntries(LOCALES.map((lang) => [lang, `${SITE_URL}/${lang}${route || ""}`])),
        },
      });
    }
  }

  return entries;
}

