import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";

export const metadata: Metadata = {
  title: "Contact Krishibridge — Get in touch with our team",
  description:
    "Reach the Krishibridge team for partnerships, onboarding as a farmer or buyer, warehouse integrations, media enquiries, or support.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
    languages: {
      en: `${SITE_URL}/contact`,
      hi: `${SITE_URL}/hi/contact`,
      ne: `${SITE_URL}/ne/contact`,
      dz: `${SITE_URL}/dz/contact`,
      ar: `${SITE_URL}/ar/contact`,
      "x-default": `${SITE_URL}/contact`,
    },
  },
  openGraph: {
    title: "Contact Krishibridge",
    description: "Talk to the team behind Asia's cross-border agri-commodity exchange.",
    url: `${SITE_URL}/contact`,
    siteName: "Krishibridge",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "Krishibridge" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Krishibridge",
    description: "Get in touch with the Krishibridge team.",
    images: ["/logo.jpeg"],
  },
};

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "support@krishibridge.com",
    href: "mailto:support@krishibridge.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 80000 00000",
    href: "tel:+918000000000",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Business: +91 80000 00000",
    href: "https://wa.me/918000000000",
  },
  {
    icon: MapPin,
    label: "Head office",
    value: "Gangtok, Sikkim, India",
  },
  {
    icon: Clock,
    label: "Support hours",
    value: "Mon–Sat · 09:00–19:00 IST",
  },
];

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Krishibridge",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@krishibridge.com",
        telephone: "+91-80000-00000",
        availableLanguage: ["English", "Hindi", "Nepali", "Arabic"],
        areaServed: ["IN", "NP", "BT", "AE", "SA", "QA", "KW", "BH", "OM"],
      },
    ],
  };

  return (
    <main className="bg-linen text-sage-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-800">
            <MessageCircle className="h-3.5 w-3.5" /> Contact
          </span>
          <h1 className="font-heading mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            We&apos;d love to hear from you.
          </h1>
          <p className="mt-5 text-lg text-sage-700">
            Whether you&apos;re a farmer cooperative, an international buyer, a warehouse partner,
            or a journalist — pick the channel that works best for you.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Channels */}
          <div className="space-y-4">
            {CHANNELS.map(({ icon: Icon, label, value, href }) => {
              const content = (
                <div className="flex items-start gap-4 rounded-2xl border border-sage-100 bg-white p-5 transition hover:border-sage-300">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-sage-500">{label}</div>
                    <div className="mt-0.5 font-medium">{value}</div>
                  </div>
                </div>
              );
              return href ? (
                <a
                  key={label}
                  href={href}
                  className="block"
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  target={href.startsWith("http") ? "_blank" : undefined}
                >
                  {content}
                </a>
              ) : (
                <div key={label}>{content}</div>
              );
            })}
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-sage-100 bg-white p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm text-sage-600">
              We usually respond within one business day.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
