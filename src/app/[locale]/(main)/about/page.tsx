import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Globe, ShieldCheck, Sprout, Users, Leaf, BarChart2 } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";

export const metadata: Metadata = {
  title: "About Krishibridge — Cross-border agri-commodity exchange",
  description:
    "Krishibridge connects smallholder farmers, warehouse operators, and global buyers across South Asia and the Middle East with transparent pricing, verified quality, and secure cross-border trading.",
  alternates: {
    canonical: `${SITE_URL}/about`,
    languages: {
      en: `${SITE_URL}/about`,
      hi: `${SITE_URL}/hi/about`,
      ne: `${SITE_URL}/ne/about`,
      dz: `${SITE_URL}/dz/about`,
      ar: `${SITE_URL}/ar/about`,
      "x-default": `${SITE_URL}/about`,
    },
  },
  openGraph: {
    title: "About Krishibridge",
    description:
      "Building Asia's trusted agri-commodity exchange — connecting farmers, warehouses, and buyers through transparent digital trade.",
    url: `${SITE_URL}/about`,
    siteName: "Krishibridge",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "Krishibridge" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Krishibridge",
    description: "Cross-border agri-commodity exchange for South Asia & the Middle East.",
    images: ["/logo.jpeg"],
  },
};

const PILLARS = [
  {
    icon: Sprout,
    title: "Farmer-first",
    body: "We anchor every auction around fair price discovery for smallholder producers. No hidden margins, no opaque middlemen.",
  },
  {
    icon: ShieldCheck,
    title: "Verified quality",
    body: "Every lot is quality-tested at our partner warehouses with grade, moisture and origin certified on-chain.",
  },
  {
    icon: Globe,
    title: "Cross-border by design",
    body: "We route trades across India, Nepal, Bhutan, and the GCC — with multi-currency invoicing and compliant logistics.",
  },
  {
    icon: BarChart2,
    title: "Transparent pricing",
    body: "Live auction feeds, public price history, and signed digital receipts for every transaction.",
  },
];

const STATS = [
  { label: "Partner farmer cooperatives", value: "120+" },
  { label: "Active lots monthly", value: "450+" },
  { label: "Countries served", value: "9" },
  { label: "Avg. farmer uplift", value: "+23%" },
];

export default function AboutPage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Krishibridge",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    description:
      "Cross-border agri-commodity exchange connecting farmers, warehouses, and buyers across South Asia and the Middle East.",
    sameAs: [
      "https://www.linkedin.com/company/krishibridge",
      "https://twitter.com/krishibridge",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@krishibridge.com",
        availableLanguage: ["English", "Hindi", "Nepali", "Arabic"],
      },
    ],
  };

  return (
    <main className="bg-linen text-sage-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-800">
                <Leaf className="h-3.5 w-3.5" /> Our story
              </span>
              <h1 className="font-heading mt-4 text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
                Building a fairer digital marketplace for <span className="text-terracotta">agri-commodities</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-sage-700">
                Krishibridge is an end-to-end exchange for premium agricultural commodities —
                Himalayan black cardamom, orthodox tea, specialty black teas and beyond. We bring
                farmers, licensed warehouses, and international buyers onto one transparent rail so
                value flows back to origin.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 rounded-full bg-sage-900 px-5 py-3 text-sm font-medium text-white hover:bg-sage-800"
                >
                  Explore marketplace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-white px-5 py-3 text-sm font-medium text-sage-900 hover:bg-sage-50"
                >
                  Talk to us
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
              <Image
                src="/logo.jpeg"
                alt="Krishibridge — cross-border agri-commodity exchange"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-sage-100 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-heading text-3xl font-semibold text-terracotta md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-sage-600">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">What we stand for</h2>
        <p className="mt-3 max-w-2xl text-sage-700">
          Four principles that shape every feature, contract, and trade on the platform.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-sage-100 bg-white p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-100 text-sage-800">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-sage-700">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission strip */}
      <section className="bg-sage-900 text-sand">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-start gap-5">
            <Users className="mt-1 h-8 w-8 text-terracotta" />
            <div>
              <h2 className="font-heading text-3xl font-semibold">Our mission</h2>
              <p className="mt-3 max-w-3xl text-sand/80">
                To make the next billion dollars of cross-border agri-trade transparent, traceable,
                and equitable — by putting verified data, fair auctions, and instant settlement
                directly in the hands of farmers and buyers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
