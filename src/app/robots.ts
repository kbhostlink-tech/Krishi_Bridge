import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block authenticated / internal surfaces from being crawled so
        // Googlebot doesn't waste crawl budget on login-walled pages.
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/admin-setup",
          "/dashboard",
          "/dashboard/",
          "/kyc",
          "/profile",
          "/rfq",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
