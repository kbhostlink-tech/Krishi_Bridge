import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";
const LOCALES = ["en", "hi", "ne", "dz", "ar"] as const;

/**
 * Public, crawlable routes. Keep this list tight — never list authenticated
 * or role-gated surfaces here, otherwise Google wastes crawl budget and
 * reports soft-404s when hit by Googlebot without a session.
 */
const PUBLIC_ROUTES = ["", "/about", "/contact", "/marketplace"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    // Default locale (no prefix)
    entries.push({
      url: `${SITE_URL}${route || "/"}`,
      lastModified: now,
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${SITE_URL}${l === "en" ? "" : `/${l}`}${route || ""}`])
        ),
      },
    });

    // Localised variants (skip default locale to avoid duplicates)
    for (const locale of LOCALES) {
      if (locale === "en") continue;
      entries.push({
        url: `${SITE_URL}/${locale}${route || ""}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
