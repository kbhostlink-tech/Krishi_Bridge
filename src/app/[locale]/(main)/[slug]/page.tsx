import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  getPublicInfoPage,
  getPublicInfoPages,
  getPublicLabels,
} from "@/lib/public-page-content-v2";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";
const LOCALES = ["en", "hi", "ne", "dz", "ar"] as const;

export const dynamic = "force-dynamic";

function localizedUrl(locale: string, slug: string) {
  return `${SITE_URL}/${locale}/${slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getPublicInfoPage(slug, locale);

  if (!page) notFound();

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: {
      canonical: localizedUrl(locale, page.slug),
      languages: {
        ...Object.fromEntries(LOCALES.map((lang) => [lang, localizedUrl(lang, page.slug)])),
        "x-default": localizedUrl("en", page.slug),
      },
    },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url: localizedUrl(locale, page.slug),
      siteName: "Krishibridge",
      images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Krishibridge" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle,
      description: page.seoDescription,
      images: ["/logo.png"],
    },
  };
}

export default async function PublicInfoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = getPublicInfoPage(slug, locale);

  if (!page) notFound();

  const labels = getPublicLabels(locale);
  const pages = getPublicInfoPages(locale);
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.seoDescription,
    url: localizedUrl(locale, page.slug),
    dateModified: "2026-04-01",
    publisher: {
      "@type": "Organization",
      name: "Krishibridge Agrifin Technologies Private Limited",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    hasPart: page.sections.map((section) => ({
      "@type": "WebPageElement",
      name: section.title,
      text: [...section.body, ...(section.items?.map((item) => `${item.title}: ${item.body}`) || [])].join(" "),
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: labels.legal, item: localizedUrl(locale, page.slug) },
      { "@type": "ListItem", position: 3, name: page.title, item: localizedUrl(locale, page.slug) },
    ],
  };

  return (
    <main className="bg-linen text-sage-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="bg-sand py-12 sm:py-16 lg:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-terracotta">{labels.legal}</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-heading text-3xl font-semibold leading-tight text-sage-950 sm:text-4xl lg:text-5xl">
                {page.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-sage-700 sm:text-lg">{page.summary}</p>
            </div>
            <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-500">{labels.updated}</p>
              <p className="mt-2 font-semibold text-sage-950">{page.updated}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:gap-8 lg:grid-cols-[0.3fr_1fr] lg:px-8 lg:py-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-sage-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-bold text-sage-950">{labels.contents}</h2>
            <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:block lg:space-y-2">
              {page.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="block rounded-xl px-3 py-2 text-sage-600 transition-colors hover:bg-sage-50 hover:text-sage-950">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="space-y-5">
          {page.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
              <h2 className="font-heading text-2xl font-semibold text-sage-950 sm:text-3xl">{section.title}</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-8 text-sage-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.items?.length ? (
                <div className="mt-5 grid gap-3">
                  {section.items.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-sage-100 bg-sage-50/45 p-4">
                      <h3 className="text-sm font-bold text-sage-950">{item.title}</h3>
                      <p className="mt-2 text-[15px] leading-7 text-sage-700">{item.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      <section className="bg-sand py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta">{labels.related}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pages.filter((item) => item.slug !== page.slug).slice(0, 5).map((item) => (
                  <Link key={item.slug} href={`/${item.slug}`} className="rounded-full border border-sage-100 px-3 py-1.5 text-sm font-medium text-sage-700 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-950">
                    {item.shortTitle}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-sage-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-sage-800">
              {labels.askQuestion}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
