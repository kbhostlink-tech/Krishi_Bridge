import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "./contact-form";
import { normalizeLocale, type LocaleCode } from "@/lib/public-page-content-v2";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";
const LOCALES = ["en", "hi", "ne", "dz", "ar"] as const;

const CONTACT_COPY: Record<LocaleCode, {
  eyebrow: string;
  title: string;
  summary: string;
  formTitle: string;
  formSummary: string;
  channelsTitle: string;
  channels: Array<{ label: string; value: string; detail: string; href?: string; type: "whatsapp" | "phone" | "email" | "office" }>;
}> = {
  en: {
    eyebrow: "Contact Krishibridge",
    title: "Reach the right desk for trade, support, and partnerships.",
    summary: "Send an enquiry for farmer onboarding, buyer sourcing, warehouse partnerships, account support, compliance questions, or fraud reports.",
    formTitle: "Send us the details",
    formSummary: "We will route your message to the right team.",
    channelsTitle: "Direct channels",
    channels: [
      { type: "whatsapp", label: "WhatsApp", value: "+91 91268 40029", detail: "Fastest for onboarding and quick support.", href: "https://wa.me/919126840029" },
      { type: "phone", label: "Phone", value: "+91 89189 35236", detail: "For urgent account, payment, or trade support.", href: "tel:+918918935236" },
      { type: "email", label: "Email", value: "krishibridge@gmail.com", detail: "Best for documents, partnerships, and formal questions.", href: "mailto:krishibridge@gmail.com" },
      { type: "office", label: "Office", value: "Sikkim, India", detail: "Serving India, Nepal, Bhutan, and buyer markets." },
    ],
  },
  hi: {
    eyebrow: "Krishibridge से संपर्क",
    title: "व्यापार, सहायता और साझेदारी के लिए सही टीम तक पहुंचें।",
    summary: "किसान ऑनबोर्डिंग, खरीदार सोर्सिंग, गोदाम साझेदारी, खाता सहायता, अनुपालन प्रश्न या धोखाधड़ी रिपोर्ट के लिए संदेश भेजें।",
    formTitle: "विवरण भेजें",
    formSummary: "हम आपका संदेश सही टीम तक पहुंचाएंगे।",
    channelsTitle: "सीधे संपर्क",
    channels: [
      { type: "whatsapp", label: "WhatsApp", value: "+91 91268 40029", detail: "ऑनबोर्डिंग और त्वरित सहायता के लिए सबसे तेज़।", href: "https://wa.me/919126840029" },
      { type: "phone", label: "फोन", value: "+91 89189 35236", detail: "तत्काल खाता, भुगतान या व्यापार सहायता के लिए।", href: "tel:+918918935236" },
      { type: "email", label: "ईमेल", value: "krishibridge@gmail.com", detail: "दस्तावेज, साझेदारी और औपचारिक प्रश्नों के लिए।", href: "mailto:krishibridge@gmail.com" },
      { type: "office", label: "कार्यालय", value: "सिक्किम, भारत", detail: "भारत, नेपाल, भूटान और खरीदार बाज़ारों की सेवा।" },
    ],
  },
  ne: {
    eyebrow: "Krishibridge सम्पर्क",
    title: "व्यापार, सहायता र साझेदारीका लागि सही टोलीसम्म पुग्नुहोस्।",
    summary: "किसान अनबोर्डिङ, खरिदकर्ता सोर्सिङ, गोदाम साझेदारी, खाता सहायता, अनुपालन प्रश्न वा ठगी रिपोर्टका लागि सन्देश पठाउनुहोस्।",
    formTitle: "विवरण पठाउनुहोस्",
    formSummary: "हामी तपाईंको सन्देश सही टोलीमा पठाउँछौँ।",
    channelsTitle: "प्रत्यक्ष च्यानलहरू",
    channels: [
      { type: "whatsapp", label: "WhatsApp", value: "+91 91268 40029", detail: "अनबोर्डिङ र छिटो सहयोगका लागि।", href: "https://wa.me/919126840029" },
      { type: "phone", label: "फोन", value: "+91 89189 35236", detail: "तत्काल खाता, भुक्तानी वा व्यापार सहयोगका लागि।", href: "tel:+918918935236" },
      { type: "email", label: "इमेल", value: "krishibridge@gmail.com", detail: "कागजात, साझेदारी र औपचारिक प्रश्नका लागि।", href: "mailto:krishibridge@gmail.com" },
      { type: "office", label: "कार्यालय", value: "सिक्किम, भारत", detail: "भारत, नेपाल, भुटान र खरिदकर्ता बजारहरू सेवा गर्दै।" },
    ],
  },
  dz: {
    eyebrow: "Krishibridge འབྲེལ་བ།",
    title: "ཚོང་ རྒྱབ་སྐྱོར་ དང་མཉམ་འབྲེལ་དོན་ལུ་འོས་འབབ་ཅན་གྱི་ཚོགས་པ་ལུ་འབྲེལ་བ་འབད།",
    summary: "ཞིང་པ་ནང་འཛུལ་ ཉོ་མི་འཚོལ་བ་ མཛོད་ཁང་མཉམ་འབྲེལ་ རྩིས་ཁྲ་རྒྱབ་སྐྱོར་ ཁྲིམས་མཐུན་དྲི་བ་ ཡང་ན་གཡོ་ཁྲམ་སྙན་ཞུ་གི་དོན་ལུ་འཕྲིན་བསྐུར།",
    formTitle: "ཁ་གསལ་བསྐུར།",
    formSummary: "ང་བཅས་ཀྱིས་འཕྲིན་དེ་འོས་འབབ་ཅན་གྱི་ཚོགས་པ་ལུ་བསྐུར་འོང་།",
    channelsTitle: "ཐད་ཀར་འབྲེལ་ལམ།",
    channels: [
      { type: "whatsapp", label: "WhatsApp", value: "+91 91268 40029", detail: "ནང་འཛུལ་དང་མགྱོགས་རྒྱབ་སྐྱོར་ལུ།", href: "https://wa.me/919126840029" },
      { type: "phone", label: "ཁ་པར།", value: "+91 89189 35236", detail: "འཕྲལ་མཁོའི་རྩིས་ཁྲ་ དངུལ་སྤྲོད་ ཡང་ན་ཚོང་རྒྱབ་སྐྱོར།", href: "tel:+918918935236" },
      { type: "email", label: "ཡིག་འཕྲིན།", value: "krishibridge@gmail.com", detail: "ཡིག་ཆ་ མཉམ་འབྲེལ་ དང་གཞུང་འབྲེལ་དྲི་བ་ལུ།", href: "mailto:krishibridge@gmail.com" },
      { type: "office", label: "ཡིག་ཚང་།", value: "Sikkim, India", detail: "India, Nepal, Bhutan དང་ཉོ་མི་ཁྲོམ་ཚུ་ལུ་ཞབས་ཏོག།" },
    ],
  },
  ar: {
    eyebrow: "اتصل ب Krishibridge",
    title: "تواصل مع الجهة المناسبة للتجارة والدعم والشراكات.",
    summary: "أرسل استفسارا عن انضمام المزارعين أو توريد المشترين أو شراكات المستودعات أو دعم الحساب أو الامتثال أو بلاغات الاحتيال.",
    formTitle: "أرسل التفاصيل",
    formSummary: "سنوجه رسالتك إلى الفريق المناسب.",
    channelsTitle: "قنوات مباشرة",
    channels: [
      { type: "whatsapp", label: "WhatsApp", value: "+91 91268 40029", detail: "الأسرع للانضمام والدعم السريع.", href: "https://wa.me/919126840029" },
      { type: "phone", label: "الهاتف", value: "+91 89189 35236", detail: "لدعم الحساب أو الدفع أو التجارة العاجل.", href: "tel:+918918935236" },
      { type: "email", label: "البريد الإلكتروني", value: "krishibridge@gmail.com", detail: "للأوراق والشراكات والأسئلة الرسمية.", href: "mailto:krishibridge@gmail.com" },
      { type: "office", label: "المكتب", value: "سيكيم، الهند", detail: "نخدم الهند ونيبال وبوتان وأسواق المشترين." },
    ],
  },
};

const CHANNEL_ICONS = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  office: MapPin,
};

function localizedUrl(locale: string) {
  return `${SITE_URL}${locale === "en" ? "" : `/${locale}`}/contact`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = CONTACT_COPY[normalizeLocale(locale)];

  return {
    title: `${copy.eyebrow} | Farmer, Buyer & Warehouse Support`,
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
      images: [{ url: "/Readytotradebg.png", width: 1200, height: 630, alt: "Contact Krishibridge" }],
      type: "website",
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = CONTACT_COPY[normalizeLocale(locale)];
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: copy.eyebrow,
    url: localizedUrl(locale),
    description: copy.summary,
    mainEntity: {
      "@type": "Organization",
      name: "Krishibridge Agrifin Technologies Private Limited",
      url: SITE_URL,
      email: "krishibridge@gmail.com",
      telephone: "+91-91268-40029",
    },
  };

  return (
    <main className="bg-linen text-sage-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />

      <section className="bg-sand py-12 sm:py-16 lg:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-terracotta">{copy.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-heading text-3xl font-semibold leading-tight text-sage-950 sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-sage-700 sm:text-lg">{copy.summary}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:px-8 lg:py-14">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-sage-950 sm:text-3xl">{copy.channelsTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {copy.channels.map((channel) => {
              const Icon = CHANNEL_ICONS[channel.type];
              const content = (
                <div className="h-full rounded-2xl border border-sage-100 bg-white p-5 shadow-sm transition-colors hover:border-sage-300">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-sage-950">{channel.label}</p>
                      <p className="mt-1 wrap-break-word text-sm font-semibold text-terracotta">{channel.value}</p>
                      <p className="mt-2 text-sm leading-6 text-sage-600">{channel.detail}</p>
                    </div>
                  </div>
                </div>
              );

              return channel.href ? (
                <a key={channel.label} href={channel.href} target={channel.href.startsWith("http") ? "_blank" : undefined} rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  {content}
                </a>
              ) : (
                <div key={channel.label}>{content}</div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-semibold text-sage-950 sm:text-3xl">{copy.formTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-sage-600">{copy.formSummary}</p>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
