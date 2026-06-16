import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getPublicLabels, normalizeLocale, type LocaleCode } from "@/lib/public-page-content-v2";
import { AboutTeamSection } from "@/components/about/about-team-section";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";
const LOCALES = ["en", "hi", "ne", "dz", "ar"] as const;

const ABOUT_COPY: Record<LocaleCode, {
  title: string;
  summary: string;
  eyebrow: string;
  cta: string;
  marketplace: string;
  exchangeTitle: string;
  exchangeBody: string;
  teamSectionLabel: string;
  sections: Array<{ title: string; body: string }>;
  facts: Array<{ value: string; label: string }>;
}> = {
  en: {
    eyebrow: "About Krishibridge",
    title: "The people and platform building trusted Himalayan trade.",
    summary:
      "Krishibridge connects verified farmers, warehouses, aggregators, and buyers through country-aware KYC, quality records, and settlement workflows — led by a team spanning commodity markets, finance, governance, and deep regional expertise.",
    cta: "Contact team",
    marketplace: "Explore marketplace",
    exchangeTitle: "Himalayan Commodity Exchange",
    exchangeBody: "Large cardamom, orthodox tea, specialty black tea, and other origin-sensitive commodities need reliable verification and settlement. Krishibridge keeps those workflows clear for sellers and buyers.",
    teamSectionLabel: "Leadership",
    facts: [
      { value: "3", label: "Launch countries" },
      { value: "4", label: "Local languages" },
      { value: "7", label: "Supported currencies" },
    ],
    sections: [
      { title: "Why we exist", body: "Premium agricultural markets need trust before scale. Krishibridge brings identity, grading, documents, payments, and trade records into one operating system." },
      { title: "What we build", body: "The platform supports listings, auctions, RFQs, warehouse verification, ownership tokens, payment records, notifications, and regional compliance workflows." },
      { title: "How we operate", body: "Krishibridge provides technology infrastructure and market access. It is designed to stay platform-neutral rather than competing with users as a principal trader." },
    ],
  },
  hi: {
    eyebrow: "Krishibridge के बारे में",
    title: "विश्वसनीय हिमालयी व्यापार बनाने वाले लोग और प्लेटफ़ॉर्म।",
    summary:
      "Krishibridge सत्यापित किसानों, गोदामों, एग्रीगेटरों और खरीदारों को KYC, गुणवत्ता रिकॉर्ड और सेटलमेंट वर्कफ़्लो से जोड़ता है — कमोडिटी बाज़ार, वित्त, शासन और क्षेत्रीय विशेषज्ञता वाली नेतृत्व टीम के नेतृत्व में।",
    cta: "टीम से संपर्क करें",
    marketplace: "मार्केटप्लेस देखें",
    exchangeTitle: "हिमालयन कमोडिटी एक्सचेंज",
    exchangeBody: "लार्ज कार्डमम, ऑर्थोडॉक्स चाय, विशेष ब्लैक टी और अन्य मूल-आधारित कमोडिटी के लिए भरोसेमंद सत्यापन और सेटलमेंट चाहिए। Krishibridge इन्हें sellers और buyers के लिए साफ रखता है।",
    teamSectionLabel: "नेतृत्व",
    facts: [
      { value: "3", label: "लॉन्च देश" },
      { value: "4", label: "स्थानीय भाषाएं" },
      { value: "7", label: "समर्थित मुद्राएं" },
    ],
    sections: [
      { title: "हम क्यों हैं", body: "प्रीमियम कृषि बाज़ारों में पैमाने से पहले भरोसा चाहिए। Krishibridge पहचान, ग्रेडिंग, दस्तावेज, भुगतान और व्यापार रिकॉर्ड को एक जगह लाता है।" },
      { title: "हम क्या बनाते हैं", body: "प्लेटफ़ॉर्म लिस्टिंग, नीलामी, RFQ, गोदाम सत्यापन, स्वामित्व टोकन, भुगतान रिकॉर्ड, सूचनाएं और क्षेत्रीय अनुपालन का समर्थन करता है।" },
      { title: "हम कैसे काम करते हैं", body: "Krishibridge तकनीकी अवसंरचना और बाज़ार पहुंच देता है। यह उपयोगकर्ताओं से प्रतिस्पर्धा करने वाले ट्रेडर की तरह नहीं, बल्कि न्यूट्रल प्लेटफ़ॉर्म की तरह काम करता है।" },
    ],
  },
  ne: {
    eyebrow: "Krishibridge बारेमा",
    title: "विश्वसनीय हिमालयी व्यापार निर्माण गर्ने टोली र प्लेटफर्म।",
    summary:
      "Krishibridge ले प्रमाणित किसान, गोदाम, एग्रीगेटर र खरिदकर्तालाई KYC, गुणस्तर रेकर्ड र सेटलमेन्ट प्रक्रियासँग जोड्छ — कमोडिटी बजार, वित्त, शासन र क्षेत्रीय विशेषज्ञता भएको नेतृत्व टोलीको मार्गदर्शनमा।",
    cta: "टोलीलाई सम्पर्क गर्नुहोस्",
    marketplace: "मार्केटप्लेस हेर्नुहोस्",
    exchangeTitle: "हिमालयन कमोडिटी एक्सचेन्ज",
    exchangeBody: "ठूलो अलैंची, अर्थोडक्स चिया, विशेष ब्ल्याक टी र अन्य उद्गम-संवेदनशील वस्तुलाई भरपर्दो प्रमाणिकरण र सेटलमेन्ट चाहिन्छ। Krishibridge ले यी प्रक्रिया seller र buyer का लागि स्पष्ट राख्छ।",
    teamSectionLabel: "नेतृत्व",
    facts: [
      { value: "3", label: "सुरुवाती देश" },
      { value: "4", label: "स्थानीय भाषा" },
      { value: "7", label: "समर्थित मुद्रा" },
    ],
    sections: [
      { title: "हामी किन छौँ", body: "प्रिमियम कृषि बजारलाई विस्तार अघि भरोसा चाहिन्छ। Krishibridge ले पहिचान, ग्रेडिङ, कागजात, भुक्तानी र व्यापार अभिलेख एउटै प्रणालीमा ल्याउँछ।" },
      { title: "हामी के बनाउँछौँ", body: "प्लेटफर्मले लिस्टिङ, लिलामी, RFQ, गोदाम प्रमाणिकरण, स्वामित्व टोकन, भुक्तानी र क्षेत्रीय अनुपालनलाई समर्थन गर्छ।" },
      { title: "हामी कसरी काम गर्छौँ", body: "Krishibridge ले प्रविधि पूर्वाधार र बजार पहुँच दिन्छ। यो प्रयोगकर्तासँग प्रतिस्पर्धा गर्ने व्यापारी होइन, प्लेटफर्म-न्यूट्रल प्रणाली हो।" },
    ],
  },
  dz: {
    eyebrow: "Krishibridge སྐོར།",
    title: "ཡིད་ཆེས་ཅན་གྱི་ཧི་མ་ལ་ཡའི་ཚོང་འབྲེལ་གཏོད་མཁན་ཚོ་དང་པད་སྟེགས།",
    summary:
      "Krishibridge གིས་ཞིང་པ་ མཛོད་ཁང་ བསྡུ་སྒྲིག་པ་ དང་ཉོ་མི་ཚུ་ KYC དང་ སྤུས་ཚད་ཐོ་ དངུལ་སྤྲོད་ལས་རིམ་ཐོག་མཐུདཔ་ཨིན། ཚོང་རྫས་ཁྲོམ་ དངུལ་རྩིས་ ཁྲིམས་ལུགས་ དང་ས་ཁོངས་ཀྱི་ཤེས་རྒྱུད་ལས་འཛིན་ཚོགས་པའི་འོག་ན།",
    cta: "ཚོགས་པ་དང་འབྲེལ་བ།",
    marketplace: "ཁྲོམ་སྟོན།",
    exchangeTitle: "Himalayan Commodity Exchange",
    exchangeBody: "ཨེ་ལ་ཆེན་པོ་ ཨོར་ཐོ་ཌོགས་ཇ་ བླེག་ཊི་ དང་ས་ཁོངས་གཞི་རྩའི་ཚོང་རྫས་ཚུ་ལུ་བདེན་སྦྱོར་དང་དངུལ་སྤྲོད་གསལ་ཏོག་ཏོ་དགོ། Krishibridge གིས་འདི་ཚུ་བཙོང་མི་དང་ཉོ་མི་ལུ་གསལ་ཏོག་ཏོ་བཞགཔ་ཨིན།",
    teamSectionLabel: "ལས་འཛིན",
    facts: [
      { value: "3", label: "འགོ་བཙུགས་རྒྱལ་ཁབ།" },
      { value: "4", label: "ས་གནས་སྐད་ཡིག།" },
      { value: "7", label: "དངུལ་ལུ་རྒྱབ་སྐྱོར།" },
    ],
    sections: [
      { title: "ང་བཅས་ག་ཅི་ལུ་ཡོདཔ་སྨོ།", body: "སོ་ནམ་ཚོང་ཁྲོམ་ལུ་རྒྱ་ཆེ་བ་ལས་ཧེ་མ་ཡིད་ཆེས་དགོ། Krishibridge གིས་ངོ་རྟགས་ སྤུས་ཚད་ ཡིག་ཆ་ དངུལ་སྤྲོད་ དང་ཚོང་ཐོ་མཉམ་སྦྲེལ་འབདཝ་ཨིན།" },
      { title: "ང་བཅས་ག་ཅི་བཟོཝ་སྨོ།", body: "པད་སྟེགས་འདི་གིས་ཐོ་བཀོད་ རིན་འདེབས་ RFQ་ མཛོད་ཁང་བདེན་སྦྱོར་ བདག་དབང་ཊོ་ཀེན་ དང་ཁྲིམས་མཐུན་ལས་རིམ་ལུ་རྒྱབ་སྐྱོར་འབདཝ་ཨིན།" },
      { title: "ང་བཅས་ག་དེ་སྦེ་ལཱ་འབདཝ་སྨོ།", body: "Krishibridge གིས་ལག་རྩལ་གཞི་རྩ་དང་ཁྲོམ་སྒོ་སྤྲོདཔ་ཨིན། ལག་ལེན་པ་དང་འགྲན་བསྡུར་འབད་མི་ཚོང་པ་མེན།" },
    ],
  },
  ar: {
    eyebrow: "عن Krishibridge",
    title: "الفريق والمنصة اللذان يبنيان تجارة الهيمالايا الزراعية الموثوقة.",
    summary:
      "تربط Krishibridge المزارعين والمستودعات والمجمعين والمشترين الموثقين عبر KYC وسجلات الجودة وتسويات التجارة — بقيادة فريق يجمع أسواق السلع والتمويل والحوكمة والخبرة الإقليمية.",
    cta: "اتصل بالفريق",
    marketplace: "استكشف السوق",
    exchangeTitle: "Himalayan Commodity Exchange",
    exchangeBody: "تحتاج الهيل الكبير والشاي الأرثوذكسي والشاي الأسود المتخصص والسلع المرتبطة بالمنشأ إلى تحقق وتسوية موثوقين. تبقي Krishibridge هذه العمليات واضحة للبائعين والمشترين.",
    teamSectionLabel: "القيادة",
    facts: [
      { value: "3", label: "دول الإطلاق" },
      { value: "4", label: "لغات محلية" },
      { value: "7", label: "عملات مدعومة" },
    ],
    sections: [
      { title: "لماذا نعمل", body: "تحتاج أسواق المنتجات الزراعية الممتازة إلى الثقة قبل التوسع. تجمع Krishibridge الهوية والتصنيف والوثائق والمدفوعات وسجلات التجارة في نظام واحد." },
      { title: "ما الذي نبنيه", body: "تدعم المنصة القوائم والمزادات وطلبات الأسعار والتحقق من المستودعات ورموز الملكية وسجلات الدفع وسير الامتثال الإقليمي." },
      { title: "كيف نعمل", body: "توفر Krishibridge بنية تقنية ووصولا إلى السوق. صممت لتبقى محايدة ولا تنافس المستخدمين كتاجر رئيسي." },
    ],
  },
};

function localizedUrl(locale: string) {
  return `${SITE_URL}${locale === "en" ? "" : `/${locale}`}/about`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = ABOUT_COPY[normalizeLocale(locale)];

  return {
    title: `${copy.eyebrow} | Himalayan Commodity Exchange`,
    description: copy.summary,
    alternates: {
      canonical: localizedUrl(locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((lang) => [lang, localizedUrl(lang)])),
        "x-default": localizedUrl("en"),
      },
    },
    openGraph: {
      title: copy.eyebrow,
      description: copy.summary,
      url: localizedUrl(locale),
      siteName: "Krishibridge",
      images: [{ url: "/kbhero1.png", width: 1200, height: 630, alt: "Krishibridge commodity exchange" }],
      type: "website",
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const localeCode = normalizeLocale(locale);
  const copy = ABOUT_COPY[localeCode];
  const labels = getPublicLabels(localeCode);
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Krishibridge Agrifin Technologies Private Limited",
    alternateName: "Krishibridge",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: copy.summary,
    areaServed: ["India", "Nepal", "Bhutan", "Gulf buyer markets"],
  };

  return (
    <main className="bg-linen text-sage-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <section className="bg-sand py-12 sm:py-16 lg:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-terracotta">{copy.eyebrow}</p>
              <h1 className="mt-4 max-w-4xl font-heading text-3xl font-semibold leading-tight text-sage-950 sm:text-4xl lg:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-sage-700 sm:text-lg">{copy.summary}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:max-w-sm lg:justify-end">
              {copy.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="min-w-[7.5rem] rounded-2xl border border-sage-100 bg-white px-4 py-3 shadow-sm"
                >
                  <p className="font-heading text-2xl font-semibold text-sage-950">{fact.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-sage-500">{fact.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          {copy.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:p-7"
            >
              <h2 className="font-heading text-xl font-semibold text-sage-950 sm:text-2xl">{section.title}</h2>
              <p className="mt-3 text-[15px] leading-7 text-sage-700">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-sand py-12 sm:py-16 lg:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AboutTeamSection sectionLabel={copy.teamSectionLabel} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta">{labels.platform}</p>
          <p className="mt-3 font-heading text-xl font-semibold text-sage-950 sm:text-2xl">{copy.exchangeTitle}</p>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-sage-700 sm:text-base">{copy.exchangeBody}</p>
        </div>
      </section>

      <section className="bg-sand py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta">{labels.company}</p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-sage-700">{copy.summary}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-full bg-sage-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-sage-800"
              >
                {copy.marketplace}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-sage-200 bg-white px-5 py-3 text-sm font-bold text-sage-800 transition-colors hover:border-sage-300 hover:bg-sage-50"
              >
                {copy.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
