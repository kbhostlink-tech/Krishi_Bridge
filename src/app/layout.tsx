import type { Metadata } from "next";
import { DM_Sans, Fraunces, Caveat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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

export const metadata: Metadata = {
  title: "HCE-X — Himalayan Commodity Exchange Platform",
  description:
    "Connect farmers, warehouse operators, and buyers across South Asia & the Middle East. Trade agricultural commodities with transparent pricing and secure transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="grain-overlay min-h-full flex flex-col font-sans bg-linen text-sage-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
