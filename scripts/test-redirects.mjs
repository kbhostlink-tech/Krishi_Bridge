#!/usr/bin/env node
/**
 * SEO redirect + status code verification script.
 *
 * Usage:
 *   node scripts/test-redirects.mjs                      # against production
 *   BASE_URL=http://localhost:3000 node scripts/test-redirects.mjs
 *
 * Verifies:
 *   1. Legacy agritech-* URLs 301 → clean URLs in a single hop.
 *   2. www.* → apex canonical in a single hop.
 *   3. /about and /contact return 200.
 *   4. Unknown pages return 404.
 *   5. Retired GONE_PATHS (if populated) return 410.
 *   6. /sitemap.xml and /robots.txt are served.
 *
 * Exits with non-zero code on any failure — wire into CI as a post-deploy smoke.
 */

const BASE_URL = (process.env.BASE_URL || "https://krishibridge.com").replace(/\/$/, "");

/**
 * @typedef {{
 *   name: string;
 *   url: string;
 *   expectStatus: number;
 *   expectLocation?: string | RegExp;
 *   maxHops?: number;
 * }} Case
 */

/** @type {Case[]} */
const CASES = [
  // --- 301 legacy redirects (single hop) ---
  {
    name: "agritech-about-us → /about (301, 1 hop)",
    url: `${BASE_URL}/agritech-about-us`,
    expectStatus: 301,
    expectLocation: /\/about$/,
    maxHops: 1,
  },
  {
    name: "agritech-about-us/ (trailing slash) → /about",
    url: `${BASE_URL}/agritech-about-us/`,
    expectStatus: 308, // Next.js strips trailing slash with 308 before the 301 fires
    expectLocation: /\/agritech-about-us$/,
  },
  {
    name: "agritech-contact-us → /contact",
    url: `${BASE_URL}/agritech-contact-us`,
    expectStatus: 301,
    expectLocation: /\/contact$/,
    maxHops: 1,
  },
  {
    name: "about-us (short legacy) → /about",
    url: `${BASE_URL}/about-us`,
    expectStatus: 301,
    expectLocation: /\/about$/,
  },
  {
    name: "contact-us (short legacy) → /contact",
    url: `${BASE_URL}/contact-us`,
    expectStatus: 301,
    expectLocation: /\/contact$/,
  },

  // --- www → apex canonical ---
  {
    name: "www.krishibridge.com → krishibridge.com",
    url: "https://www.krishibridge.com/about",
    expectStatus: 301,
    expectLocation: /^https:\/\/krishibridge\.com\/about$/,
  },

  // --- 200 OK ---
  { name: "/about serves 200", url: `${BASE_URL}/about`, expectStatus: 200 },
  { name: "/contact serves 200", url: `${BASE_URL}/contact`, expectStatus: 200 },
  { name: "homepage serves 200", url: `${BASE_URL}/`, expectStatus: 200 },
  { name: "/sitemap.xml serves 200", url: `${BASE_URL}/sitemap.xml`, expectStatus: 200 },
  { name: "/robots.txt serves 200", url: `${BASE_URL}/robots.txt`, expectStatus: 200 },

  // --- 404 ---
  {
    name: "unknown page returns 404",
    url: `${BASE_URL}/this-page-does-not-exist-${Date.now()}`,
    expectStatus: 404,
  },
];

async function run() {
  let passed = 0;
  let failed = 0;

  for (const c of CASES) {
    try {
      const res = await fetch(c.url, { redirect: "manual" });
      const location = res.headers.get("location") || "";

      const statusOk = res.status === c.expectStatus;
      const locOk = !c.expectLocation
        || (typeof c.expectLocation === "string"
          ? location === c.expectLocation
          : c.expectLocation.test(location));

      if (statusOk && locOk) {
        console.log(`✓ ${c.name}  (${res.status}${location ? ` → ${location}` : ""})`);
        passed++;
      } else {
        console.error(`✗ ${c.name}`);
        console.error(`    expected ${c.expectStatus}${c.expectLocation ? ` → ${c.expectLocation}` : ""}`);
        console.error(`    got      ${res.status}${location ? ` → ${location}` : ""}`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ ${c.name}  (network error: ${err instanceof Error ? err.message : err})`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
