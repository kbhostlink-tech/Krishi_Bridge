import type { Metadata } from "next";
import { DM_Sans, Fraunces, Caveat, Poppins, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com"),
  title: {
    default: "Krishibridge — Cross-border agri-commodity exchange",
    template: "%s · Krishibridge",
  },
  description:
    "Krishibridge is a cross-border agri-commodity exchange connecting farmers, warehouse operators, and buyers across South Asia and the Middle East. Trade black cardamom, orthodox tea, and premium agri-goods with transparent pricing and secure settlement.",
  applicationName: "Krishibridge",
  generator: "Next.js",
  keywords: [
    "agri-commodity exchange",
    "black cardamom",
    "orthodox tea",
    "black tea",
    "farmer marketplace",
    "agricultural trading",
    "South Asia",
    "Middle East",
    "India Nepal Bhutan agri exchange",
    "Krishibridge",
    "agritech",
  ],
  authors: [{ name: "Krishibridge" }],
  creator: "Krishibridge",
  publisher: "Krishibridge",
  formatDetection: { email: false, telephone: false, address: false },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      hi: "/hi",
      ne: "/ne",
      dz: "/dz",
      ar: "/ar",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Krishibridge",
    title: "Krishibridge — Cross-border agri-commodity exchange",
    description:
      "Connect farmers, warehouse operators, and buyers across South Asia & the Middle East. Transparent pricing, verified quality, secure cross-border settlement.",
    url: "/",
    locale: "en_US",
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: "Krishibridge" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krishibridge — Cross-border agri-commodity exchange",
    description: "Transparent, secure cross-border trading for premium agri-commodities.",
    images: ["/logo.png"],
    creator: "@krishibridge",
  },
  // Favicon: Next.js auto-serves /icon.jpg and /apple-icon.jpg placed in src/app/
  // via the file-based convention. No explicit `icons` config needed; the
  // entries below are kept only for legacy <link rel="icon"> in older crawlers.
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krishibridge.com";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Krishibridge",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Cross-border agri-commodity exchange connecting farmers, warehouses and buyers across South Asia and the Middle East.",
    sameAs: [
      "https://www.linkedin.com/company/krishibridge",
      "https://twitter.com/krishibridge",
    ],
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Krishibridge",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/marketplace?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} ${caveat.variable} ${poppins.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="grain-overlay min-h-full flex flex-col font-sans bg-linen text-sage-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ConfirmDialogProvider>
          {children}
        </ConfirmDialogProvider>
        <Toaster position="top-right" richColors closeButton expand={false} />
      </body>
    </html>
  );
}

