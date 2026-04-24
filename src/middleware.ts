import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Paths that existed on the old site but no longer exist and should NOT be
 * redirected (they have no modern equivalent). We serve HTTP 410 Gone so
 * Google de-indexes them quickly, rather than a soft-404.
 *
 * Use an exact-match set for surgical precision — redirects for kept pages
 * live in next.config.ts `redirects()`.
 */
const GONE_PATHS = new Set<string>([
  // Add legacy URLs here as they are identified in Search Console, e.g.:
  // "/agritech-old-promo",
  // "/agritech-legacy-newsletter",
]);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Serve 410 Gone for explicitly retired legacy URLs.
  if (GONE_PATHS.has(pathname)) {
    return new NextResponse(
      `<!doctype html><html><head><meta name="robots" content="noindex"><title>Gone</title></head><body><h1>410 Gone</h1><p>This page has been permanently removed.</p></body></html>`,
      {
        status: 410,
        headers: { "content-type": "text/html; charset=utf-8" },
      }
    );
  }

  // 2) Delegate everything else to next-intl's locale middleware.
  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except API routes, Next.js internals, and static files
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

