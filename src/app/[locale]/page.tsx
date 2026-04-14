"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  BarChart2,
  FileText,
  Wallet,
  Globe,
  Languages,
  Shield,
  Scale,
  UserCheck,
  Package,
  MessageSquare,
  CreditCard,
  Building2,
  Menu,
  X,
  ArrowRight,
  Check,
  Leaf,
} from "lucide-react";

const COMMODITIES = [
  { name: "Large Cardamom", origin: "Sikkim, Nepal" },
  { name: "Darjeeling Tea", origin: "India, Nepal" },
  { name: "Ginger", origin: "India, Bhutan" },
  { name: "Turmeric", origin: "India, Nepal" },
  { name: "Black Pepper", origin: "India, Oman" },
  { name: "Coffee", origin: "India, UAE" },
  { name: "Saffron", origin: "India, Saudi Arabia" },
  { name: "Cinnamon", origin: "India, Nepal" },
];

const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
];

const STATS = [
  { value: "6", label: "Countries" },
  { value: "10+", label: "Commodities" },
  { value: "24/7", label: "Live Trading" },
  { value: "100%", label: "KYC Verified" },
];

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#commodities", label: "Commodities" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#countries", label: "Countries" },
];

const FEATURES = [
  {
    Icon: Search,
    title: "Quality Verified",
    desc: "Every lot passes warehouse quality checks — moisture, grade, and traceability verified before listing.",
  },
  {
    Icon: BarChart2,
    title: "Real-Time Auctions",
    desc: "Live bidding with anti-sniping protection, proxy bidding, and reserve prices for fair price discovery.",
  },
  {
    Icon: FileText,
    title: "RFQ Negotiations",
    desc: "Buyers post requirements, farmers and aggregators compete with quotes. Multi-round negotiation until the best deal is struck.",
  },
  {
    Icon: Wallet,
    title: "Token Ownership",
    desc: "Digital ownership tokens with HMAC-signed QR codes for tamper-proof warehouse redemption.",
  },
  {
    Icon: Globe,
    title: "Multi-Currency",
    desc: "Trade in INR, NPR, BTN, AED, SAR, OMR, or USD with real-time FX rates from Wise API.",
  },
  {
    Icon: Languages,
    title: "5 Languages + RTL",
    desc: "Full support for English, Hindi, Nepali, Dzongkha, and Arabic with right-to-left layouts.",
  },
];

const HOW_IT_WORKS = [
  {
    Icon: UserCheck,
    step: "01",
    title: "Register & Verify",
    desc: "Create your account as a Farmer, Seller, or Buyer. Complete KYC with country-specific documents for verified trading.",
  },
  {
    Icon: Package,
    step: "02",
    title: "List or Browse Commodities",
    desc: "Farmers submit produce through warehouse intake with quality checks. Buyers browse the verified marketplace.",
  },
  {
    Icon: MessageSquare,
    step: "03",
    title: "Bid, Quote, or Negotiate",
    desc: "Place bids in live auctions or submit RFQ quotes. Multi-round negotiations help find the perfect price.",
  },
  {
    Icon: CreditCard,
    step: "04",
    title: "Pay & Receive Token",
    desc: "Secure multi-gateway payments with tax compliance. Receive a digital ownership token with signed QR code.",
  },
  {
    Icon: Building2,
    step: "05",
    title: "Redeem at Warehouse",
    desc: "Present your QR code at the designated warehouse. Staff verifies the token and releases your commodity.",
  },
];

function HceLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#2d5a3f" />
      <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
      <path d="M15 14 L18 20 L12 20 Z" fill="white" />
      <circle cx="30" cy="10" r="3" fill="white" fillOpacity="0.45" />
    </svg>
  );
}

export default function LocaleHomePage() {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linen">
      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sage-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <HceLogo size={36} />
              <div className="flex flex-col leading-tight">
                <span className="font-heading text-sage-900 text-[15px] font-bold leading-none tracking-tight">
                  HCE-X
                </span>
                <span className="text-sage-500 text-[9px] leading-tight hidden sm:block tracking-wide">
                  Himalayan Commodity Exchange
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-4 py-2 rounded-full text-sm font-medium text-sage-600 hover:text-sage-900 hover:bg-sage-50 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-medium text-sage-700 hover:text-sage-900 transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {t("nav.register")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile controls */}
            <div className="flex md:hidden items-center gap-1">
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-sage-700"
              >
                {t("nav.login")}
              </Link>
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-sage-700 hover:bg-sage-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile nav drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-sage-100 py-3 pb-4 space-y-0.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sage-700 hover:bg-sage-50 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 px-4">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  {t("nav.register")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-sage-100/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-terracotta/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-sage-50/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200/60 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-sage-400 animate-pulse" />
              <span className="text-sage-700 text-xs font-semibold tracking-wide uppercase">
                Transparent · Secure · Cross-Border Trading
              </span>
            </div>

            <p className="font-script text-terracotta text-xl sm:text-2xl mb-3">
              {t("app.tagline")}
            </p>

            <h1 className="font-heading text-sage-900 text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold tracking-tight mb-5 leading-[1.1]">
              Himalayan Commodity
              <br />
              <span className="text-sage-600">Exchange Platform</span>
            </h1>

            <p className="text-sage-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              A multi-country digital marketplace connecting farmers, sellers, and buyers
              through transparent, secure, and efficient trading of agricultural commodities
              across South Asia and the Middle East.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sage-700 hover:bg-sage-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base shadow-lg shadow-sage-700/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Trading Today
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-sage-300 text-sage-700 hover:border-sage-500 hover:bg-sage-50 font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base"
              >
                {t("nav.login")}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center px-2">
                  <div className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-sage-500 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="bg-sand py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">Why HCE-X</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              Built for Agricultural Trade
            </h2>
            <p className="text-sage-500 text-base mt-4 max-w-xl mx-auto">
              End-to-end trade execution from commodity listing to final delivery,
              with escrow payments, tokenized ownership, and cross-border compliance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-linen rounded-3xl p-7 sm:p-8 shadow-sm border border-sage-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-sage-700" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-sage-900 text-lg font-semibold mb-2">
                  {title}
                </h3>
                <p className="text-sage-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">Simple &amp; Transparent</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              How It Works
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {HOW_IT_WORKS.map(({ Icon, step, title, desc }, i) => (
              <div key={step} className="flex gap-6 sm:gap-8 mb-10 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sage-700 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={1.8} />
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="w-0.5 flex-1 bg-sage-200 mt-3" />
                  )}
                </div>
                <div className="pb-10 last:pb-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sage-400 text-xs font-semibold font-heading tracking-widest">
                      STEP {step}
                    </span>
                  </div>
                  <h3 className="font-heading text-sage-900 text-xl font-semibold mb-2">
                    {title}
                  </h3>
                  <p className="text-sage-500 leading-relaxed max-w-lg">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMMODITIES ═══ */}
      <section id="commodities" className="bg-sage-900 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta-light text-lg mb-2">What We Trade</p>
            <h2 className="font-heading text-white text-3xl sm:text-4xl font-bold">
              Premium Agricultural Commodities
            </h2>
            <p className="text-sage-300 text-base mt-4 max-w-xl mx-auto">
              From the Himalayan foothills to Gulf markets — quality-verified produce
              with full traceability and tokenized ownership.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {COMMODITIES.map((commodity) => (
              <div
                key={commodity.name}
                className="bg-sage-800/50 backdrop-blur-sm border border-sage-700/40 rounded-2xl p-5 sm:p-6 hover:bg-sage-800/80 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-sage-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sage-600/50 transition-colors">
                  <Leaf className="w-5 h-5 text-sage-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-white text-sm sm:text-base font-semibold mb-1">
                  {commodity.name}
                </h3>
                <p className="text-sage-400 text-xs">{commodity.origin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COUNTRIES ═══ */}
      <section id="countries" className="py-20 sm:py-28 bg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">Cross-Border Trading</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              Active in 6 Countries
            </h2>
            <p className="text-sage-500 text-lg mt-4 max-w-2xl mx-auto">
              Trade seamlessly across South Asia and the Middle East with
              localized payment gateways, tax compliance, and KYC verification.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="bg-linen rounded-2xl p-6 text-center border border-sage-100/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="text-4xl block mb-3">{country.flag}</span>
                <h3 className="font-heading text-sage-900 text-sm font-semibold">
                  {country.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">Built to Last</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              Secure &amp; Compliant by Design
            </h2>
          </div>
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-sage-100/60">
              <div className="w-12 h-12 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-sage-700" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-sage-900 text-xl font-semibold mb-3">
                Security First
              </h3>
              <ul className="space-y-2.5">
                {[
                  "bcrypt password hashing (cost 12)",
                  "JWT with 15-min expiry + refresh rotation",
                  "HMAC-SHA256 signed ownership tokens",
                  "Zod validation on every API route",
                  "Rate limiting & brute-force protection",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sage-600 text-sm">
                    <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-sage-100/60">
              <div className="w-12 h-12 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-5">
                <Scale className="w-6 h-6 text-sage-700" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-sage-900 text-xl font-semibold mb-3">
                Compliance Built-In
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Country-specific KYC verification",
                  "Multi-gateway payment routing",
                  "Geo-compliant tax calculation",
                  "Immutable audit logs on all trades",
                  "Data privacy per DPDPA & GDPR",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sage-600 text-sm">
                    <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28 bg-sage-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-sage-600/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-sage-500/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-script text-sage-200 text-xl mb-3">Ready to trade?</p>
          <h2 className="font-heading text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Join HCE-X Today
          </h2>
          <p className="text-sage-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re a farmer seeking the best price or a buyer sourcing premium
            Himalayan commodities — HCE-X connects you with verified, compliant partners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-sage-800 font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base hover:bg-sage-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-sage-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <HceLogo size={32} />
              <div className="flex flex-col leading-tight">
                <span className="text-white font-heading font-bold text-sm">HCE-X</span>
                <span className="text-sage-400 text-[10px]">Himalayan Commodity Exchange</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {COUNTRIES.map((c) => (
                <span key={c.code} className="text-lg" title={c.name}>
                  {c.flag}
                </span>
              ))}
            </div>
            <p className="text-sage-400 text-sm text-center sm:text-right">
              &copy; {new Date().getFullYear()} Himalayan Commodity Exchange Platform.
              <br className="sm:hidden" /> All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
