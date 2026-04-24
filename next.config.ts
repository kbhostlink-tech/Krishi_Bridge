import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },

  // Next.js default is trailingSlash:false → automatically strips trailing "/" which
  // turns `/agritech-about-us/` (indexed) into `/agritech-about-us` before our redirect
  // table matches. We keep the default and list both shapes just in case a proxy
  // preserves the slash.
  trailingSlash: false,

  async redirects() {
    return [
      // ─────────────────────────────────────────────────────────
      // Legacy agritech-* URLs → new clean URLs (SEO-preserving 301)
      // These are the URLs Google has indexed from the old site.
      //
      // NOTE: www → apex canonicalisation is intentionally handled by Vercel's
      // domain configuration (Project → Settings → Domains → set
      // `krishibridge.com` as primary). Doing it here as well causes an
      // ERR_TOO_MANY_REDIRECTS loop because Vercel's edge redirect and the
      // Next.js redirect fight each other.
      // ─────────────────────────────────────────────────────────
      { source: "/agritech-about-us", destination: "/about", permanent: true },
      { source: "/agritech-about-us/:slug*", destination: "/about", permanent: true },
      { source: "/agritech-contact-us", destination: "/contact", permanent: true },
      { source: "/agritech-contact-us/:slug*", destination: "/contact", permanent: true },

      // Common legacy variants seen in external backlinks.
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Security + SEO-friendly headers applied to every route.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
