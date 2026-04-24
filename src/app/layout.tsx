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
  title: "Krishibridge — Cross-border agri-commodity exchange",
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
      className={`${dmSans.variable} ${fraunces.variable} ${caveat.variable} ${poppins.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="grain-overlay min-h-full flex flex-col font-sans bg-linen text-sage-900">
        <ConfirmDialogProvider>
          {children}
        </ConfirmDialogProvider>
        <Toaster position="top-right" richColors closeButton expand={false} />
      </body>
    </html>
  );
}
