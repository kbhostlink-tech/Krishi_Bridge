"use client";

import { useState } from "react";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { localeNames, localeFlags, routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  QrCode,
  Globe,
  Languages,
  Scale,
  UserCheck,
  Menu,
  X,
  ArrowRight,
  Check,
  Leaf,
  MessageCircle,
  Phone,
  Mail,
  ArrowUpRight,
  BadgeCheck,
  Gavel,
  FileText,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Lock,
  Zap,
  ShieldCheck,
  Users,
  MapPin,
  ExternalLink,
  Sprout,
  Star,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const COMMODITIES = [
  { name: "Black Cardamom", origin: "Sikkim, Nepal, Bhutan", priceBand: "₹1,680–₹2,100/kg", activeLots: 18, color: "sage" },
  { name: "Orthodox Tea",   origin: "Darjeeling, Nepal",    priceBand: "₹720–₹1,040/kg",   activeLots: 14, color: "terracotta" },
  { name: "Black Tea",       origin: "Assam, Nepal",          priceBand: "₹380–₹560/kg",     activeLots: 22, color: "sage" },
];

const COUNTRIES = [
  { code: "IN", name: "India",        flag: "🇮🇳", role: "Origin & Buyer", currency: "INR" },
  { code: "NP", name: "Nepal",        flag: "🇳🇵", role: "Origin & Buyer", currency: "NPR" },
  { code: "BT", name: "Bhutan",       flag: "🇧🇹", role: "Origin",         currency: "BTN" },
  { code: "AE", name: "UAE",          flag: "🇦🇪", role: "Importer",       currency: "AED" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", role: "Importer",       currency: "SAR" },
  { code: "OM", name: "Oman",         flag: "🇴🇲", role: "Importer",       currency: "OMR" },
];

const TICKER_ITEMS = [
  { symbol: "CARD",  name: "Large Cardamom",  price: "₹1,612/kg",     change: "+2.3%", up: true  },
  { symbol: "DTEA",  name: "Darjeeling Tea",  price: "₹742/kg",       change: "+0.8%", up: true  },
  { symbol: "GING",  name: "Ginger",          price: "₹98/kg",        change: "-1.2%", up: false },
  { symbol: "TURM",  name: "Turmeric",        price: "₹168/kg",       change: "+3.1%", up: true  },
  { symbol: "BPEP",  name: "Black Pepper",    price: "₹558/kg",       change: "+0.4%", up: true  },
  { symbol: "SAFF",  name: "Saffron",         price: "₹2,74,500/kg",  change: "+1.7%", up: true  },
  { symbol: "COFF",  name: "Coffee",          price: "₹312/kg",       change: "-0.6%", up: false },
  { symbol: "CINN",  name: "Cinnamon",        price: "₹268/kg",       change: "+2.0%", up: true  },
];

const TRUST_METRICS = [
  { value: "₹2.4Cr+",   label: "Total Volume Traded" },
  { value: "340+",       label: "Verified Lots Closed" },
  { value: "600+",       label: "Registered Traders" },
  { value: "99.9%",      label: "Platform Uptime" },
];

const SCALE_STATS = [
  { value: "6",    label: "Countries" },
  { value: "10+",  label: "Commodities" },
  { value: "5",    label: "Languages" },
  { value: "7",    label: "Currencies" },
];



/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */

export default function LocaleHomePage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<"farmer" | "buyer">("farmer");

  const switchLocale = (newLocale: string) => {
    if (typeof window !== "undefined") localStorage.setItem("manual_locale", "true");
    router.replace(pathname, { locale: newLocale });
  };

  const NAV_LINKS = [
    { href: "#market",      label: "Live Market" },
    { href: "#features",    label: t("home.navFeatures") },
    { href: "#how-it-works",label: t("home.navHowItWorks") },
    { href: "#commodities", label: t("home.navCommodities") },
    { href: "#countries",   label: t("home.navCountries") },
  ];

  const doubledTicker = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="min-h-screen bg-linen">

      {/* ═══════════════════════════════════
          SUPPORT BAR
      ═══════════════════════════════════ */}
      <div className="bg-sage-900 text-sage-300 text-xs py-2 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
            <a href="tel:+919126840029" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              +91 91268 40029
            </a>
            <a href="mailto:krishibridge@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5" />
              krishibridge@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-sage-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Live exchange — 53 active lots open right now</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          NAVBAR
      ═══════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-sage-100/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="Krishibridge home">
              <BrandLogo size={40} priority />
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href}
                  className="px-3.5 py-2 rounded-full text-[13px] font-medium text-sage-600 hover:text-sage-900 hover:bg-sage-50 transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full h-9 px-3 flex items-center gap-1.5 hover:bg-sage-50 outline-none cursor-pointer text-sm border border-sage-200">
                  <span>{localeFlags[locale]}</span>
                  <span className="text-sage-600 text-xs font-medium">{locale.toUpperCase()}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {routing.locales.map((loc: string) => (
                    <DropdownMenuItem key={loc} onClick={() => switchLocale(loc)}
                      className={loc === locale ? "bg-sage-50 font-medium" : ""}>
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/login"
                className="px-5 py-2 text-sm font-medium text-sage-700 hover:text-sage-900 transition-colors">
                {t("nav.login")}
              </Link>
              <Link href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold rounded-full transition-all shadow-sm hover:shadow-md">
                {t("nav.register")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full h-8 px-2 flex items-center gap-1 hover:bg-sage-50 outline-none cursor-pointer border border-sage-200">
                  <span>{localeFlags[locale]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {routing.locales.map((loc: string) => (
                    <DropdownMenuItem key={loc} onClick={() => switchLocale(loc)}
                      className={loc === locale ? "bg-sage-50 font-medium" : ""}>
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/login" className="px-3 py-2 text-sm font-medium text-sage-700">{t("nav.login")}</Link>
              <button onClick={() => setMobileMenuOpen((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-sage-700 hover:bg-sage-100 transition-colors"
                aria-label="Toggle menu">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-sage-100 py-3 pb-4 space-y-0.5">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sage-700 hover:bg-sage-50 transition-colors">
                  {l.label}
                </a>
              ))}
              <div className="pt-3 px-4">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold rounded-full transition-colors">
                  {t("nav.register")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="pt-2 px-4 flex flex-col gap-2 text-sm text-sage-600">
                <a href="https://wa.me/919126840029" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> WhatsApp Support
                </a>
                <a href="tel:+919126840029" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> +91 91268 40029
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-125 h-125 rounded-full bg-sage-100/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-100 h-100 rounded-full bg-terracotta/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-150 rounded-full bg-sage-50/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
          {/* Headline — outcome-focused */}
          <div className="text-center max-w-4xl mx-auto">
            <p className="font-script text-terracotta text-xl sm:text-2xl mb-3">
              {t("app.tagline")}
            </p>
            <h1 className="font-heading text-sage-900 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
              Verified Himalayan commodities.
              <br />
              <span className="text-sage-600">Tokenised trade. Six countries.</span>
            </h1>
            <p className="text-sage-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("home.heroDesc")}
            </p>

            {/* Persona toggle + CTAs */}
            <div className="flex flex-col items-center gap-5">
              <div className="inline-flex items-center bg-sage-100/70 rounded-full p-1 gap-1">
                <button
                  onClick={() => setActivePersona("farmer")}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    activePersona === "farmer"
                      ? "bg-sage-700 text-white shadow-sm"
                      : "text-sage-600 hover:text-sage-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Sprout className="w-4 h-4" /> I&apos;m a Farmer / Seller</span>
                </button>
                <button
                  onClick={() => setActivePersona("buyer")}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    activePersona === "buyer"
                      ? "bg-sage-700 text-white shadow-sm"
                      : "text-sage-600 hover:text-sage-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> I&apos;m a Buyer / Importer</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {activePersona === "farmer" ? (
                  <>
                    <Link href="/register?role=farmer"
                      className="inline-flex items-center justify-center gap-2 bg-sage-700 hover:bg-sage-800 text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-sage-700/20 hover:shadow-xl hover:-translate-y-0.5 text-base">
                      List your harvest
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/marketplace"
                      className="inline-flex items-center justify-center border-2 border-sage-300 text-sage-700 hover:border-sage-500 hover:bg-sage-50 font-semibold px-8 py-4 rounded-full transition-all text-base">
                      See how it works
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/marketplace"
                      className="inline-flex items-center justify-center gap-2 bg-sage-700 hover:bg-sage-800 text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-sage-700/20 hover:shadow-xl hover:-translate-y-0.5 text-base">
                      Browse today&apos;s lots
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/register?role=buyer"
                      className="inline-flex items-center justify-center border-2 border-sage-300 text-sage-700 hover:border-sage-500 hover:bg-sage-50 font-semibold px-8 py-4 rounded-full transition-all text-base">
                      Create buyer account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Scale stats */}
          <div className="mt-14 max-w-2xl mx-auto grid grid-cols-4 gap-4 sm:gap-8 border-t border-sage-100 pt-8">
            {SCALE_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">{stat.value}</div>
                <div className="text-sage-500 text-xs sm:text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          LIVE MARKET TICKER
      ═══════════════════════════════════ */}
      <section id="market" className="bg-sage-900 border-y border-sage-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <div className="shrink-0 flex items-center gap-2 pr-4 border-r border-sage-700">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sage-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              Live Prices
            </span>
          </div>
          <div className="overflow-hidden flex-1 kb-ticker kb-fade-edges">
            <div className="kb-ticker-track flex items-center gap-8 whitespace-nowrap w-max">
              {doubledTicker.map((item, i) => (
                <div key={`${item.symbol}-${i}`} className="flex items-center gap-2">
                  <span className="text-sage-400 text-xs font-mono font-semibold">{item.symbol}</span>
                  <span className="text-white text-xs font-medium">{item.price}</span>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${item.up ? "text-green-400" : "text-red-400"}`}>
                    {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {item.change}
                  </span>
                  <span className="text-sage-700 mx-2">·</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/marketplace"
            className="shrink-0 ml-4 pl-4 border-l border-sage-700 text-sage-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors">
            View all <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FEATURES — weighted layout
      ═══════════════════════════════════ */}
      <section id="features" className="bg-sand py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">{t("home.featuresTagline")}</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-sage-500 text-base mt-4 max-w-xl mx-auto">
              {t("home.featuresDesc")}
            </p>
          </div>

          {/* Featured row — two standout capabilities */}
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            {/* Token Ownership — largest, most novel */}
            <div className="bg-sage-700 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden group hover:bg-sage-800 transition-colors">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  <Star className="w-3 h-3 fill-white/80" /> Most Distinctive
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors">
                  <QrCode className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-white text-2xl font-semibold mb-3">
                  {t("home.feature4Title")}
                </h3>
                <p className="text-sage-200 leading-relaxed">
                  Digital ownership tokens linked to physical lots — scan a QR code at any partner warehouse and walk away with your commodity. No paperwork, no fraud.
                </p>
              </div>
            </div>

            {/* Dzongkha / 5 Languages — unique differentiator */}
            <div className="bg-linen border-2 border-sage-100 rounded-3xl p-8 sm:p-10 relative overflow-hidden group hover:border-sage-200 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-terracotta/5 rounded-full -translate-y-1/4 translate-x-1/4" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-terracotta/10 text-terracotta text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  <Zap className="w-3 h-3" /> Unique in the market
                </div>
                <div className="w-14 h-14 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-5">
                  <Languages className="w-7 h-7 text-sage-700" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-sage-900 text-2xl font-semibold mb-3">
                  {t("home.feature6Title")}
                </h3>
                <p className="text-sage-500 leading-relaxed">
                  The only commodity platform with native <strong className="text-sage-700">Dzongkha</strong> support — serving Bhutanese farmers in their language. Plus Hindi, Nepali, and full Arabic RTL for Gulf buyers.
                </p>
              </div>
            </div>
          </div>

          {/* Standard grid — remaining 4 features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                Icon: BarChart2,
                title: t("home.feature2Title"),
                desc: "Live bidding with anti-sniping protection and proxy bids — so the best price wins, not the fastest click.",
              },
              {
                Icon: FileText,
                title: t("home.feature3Title"),
                desc: "Post your buying requirement, receive competing quotes, negotiate across multiple rounds until deal is done.",
              },
              {
                Icon: BadgeCheck,
                title: t("home.feature1Title"),
                desc: "Every lot inspected for moisture, grade, and origin before appearing on the marketplace. No surprises on delivery.",
              },
              {
                Icon: Globe,
                title: t("home.feature5Title"),
                desc: "INR, NPR, BTN, AED, SAR, OMR or USD — real-time rates, local payment gateways, and geo-compliant tax.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-linen rounded-2xl p-6 border border-sage-100/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 bg-sage-700/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-sage-700" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-sage-900 text-base font-semibold mb-2">{title}</h3>
                <p className="text-sage-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          PERSONAS — farmer vs buyer tracks
      ═══════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">Who is this for?</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              Built for every side of the trade
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Farmer / Seller */}
            <div className="bg-sage-700 rounded-3xl p-8 sm:p-10 text-white">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-6">
                <Sprout className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-white text-2xl font-bold mb-2">
                Farmers &amp; Sellers
              </h3>
              <p className="text-sage-200 mb-6 leading-relaxed">
                List your harvest, reach Gulf buyers directly, and receive verified payments — without brokers eating your margin.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Warehouse-backed lot listing with quality verification",
                  "Live auctions + RFQ to maximise your price",
                  "Instant payment on lot closure, escrow-protected",
                  "Track your lot from intake to buyer redemption",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sage-100 text-sm">
                    <Check className="w-4 h-4 text-sage-300 mt-0.5 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=farmer"
                className="inline-flex items-center gap-2 bg-white text-sage-800 font-semibold px-6 py-3 rounded-full hover:bg-sage-50 transition-colors">
                List your harvest <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Buyer / Importer */}
            <div className="bg-sand border-2 border-sage-100 rounded-3xl p-8 sm:p-10">
              <div className="w-14 h-14 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-sage-700" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-sage-900 text-2xl font-bold mb-2">
                Buyers &amp; Importers
              </h3>
              <p className="text-sage-600 mb-6 leading-relaxed">
                Source verified Himalayan produce at transparent prices. Bid in live auctions or post RFQs and let sellers compete for your business.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Browse lots with lab-verified quality reports",
                  "Bid or post RFQs — you control the process",
                  "Digital ownership token, redeemable at warehouse",
                  "Multi-currency payments: AED, SAR, OMR, USD supported",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sage-600 text-sm">
                    <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=buyer"
                className="inline-flex items-center gap-2 bg-sage-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-sage-800 transition-colors">
                Browse today&apos;s lots <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          HOW IT WORKS — 4 steps
      ═══════════════════════════════════ */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-linen border-t border-sage-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">{t("home.howTagline")}</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              {t("home.howTitle")}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                Icon: UserCheck,
                step: "01",
                title: t("home.step1Title"),
                desc: t("home.step1Desc"),
              },
              {
                Icon: Sprout,
                step: "02",
                title: t("home.step2Title"),
                desc: t("home.step2Desc"),
              },
              {
                Icon: Gavel,
                step: "03",
                title: t("home.step3Title"),
                desc: t("home.step3Desc"),
              },
              {
                Icon: QrCode,
                step: "04",
                title: "Pay, Token & Redeem",
                desc: "Secure multi-gateway payment with full tax compliance. Receive your HMAC-signed QR ownership token, then present it at any partner warehouse to release your commodity.",
              },
            ].map(({ Icon, step, title, desc }, i) => (
              <div key={step} className="flex gap-6 sm:gap-8 mb-10 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sage-700 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={1.8} />
                  </div>
                  {i < 3 && <div className="w-0.5 flex-1 bg-sage-200 mt-3" />}
                </div>
                <div className="pb-10 last:pb-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sage-400 text-xs font-semibold font-heading tracking-widest">
                      {t("home.stepPrefix")} {step}
                    </span>
                  </div>
                  <h3 className="font-heading text-sage-900 text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-sage-500 leading-relaxed max-w-lg">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          COMMODITIES — enriched cards
      ═══════════════════════════════════ */}
      <section id="commodities" className="bg-sage-900 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <p className="font-script text-terracotta-light text-lg mb-2">{t("home.commoditiesTagline")}</p>
              <h2 className="font-heading text-white text-3xl sm:text-4xl font-bold">
                {t("home.commoditiesTitle")}
              </h2>
              <p className="text-sage-300 text-base mt-3 max-w-xl">
                {t("home.commoditiesDesc")}
              </p>
            </div>
            <Link href="/marketplace"
              className="shrink-0 inline-flex items-center gap-2 border border-sage-600 text-sage-300 hover:text-white hover:border-sage-400 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
              View all lots <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {COMMODITIES.map((c) => (
              <Link
                key={c.name}
                href="/marketplace"
                className={`group rounded-2xl p-5 sm:p-6 border transition-all duration-300 cursor-pointer ${
                  c.color === "sage"
                    ? "bg-sage-800/60 border-sage-700/40 hover:bg-sage-800/90 hover:border-sage-600"
                    : "bg-sage-800/40 border-sage-700/30 hover:bg-sage-800/70 hover:border-sage-500"
                }`}
              >
                <div className="w-10 h-10 bg-sage-600/25 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sage-600/40 transition-colors">
                  <Leaf className="w-5 h-5 text-sage-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-white text-sm sm:text-base font-semibold mb-0.5">
                  {c.name}
                </h3>
                <p className="text-sage-400 text-xs mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {c.origin}
                </p>
                <div className="border-t border-sage-700/50 pt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sage-400 text-[10px] uppercase tracking-wider mb-0.5">Indicative band</p>
                    <p className="text-sage-200 text-xs font-medium tabular-nums">{c.priceBand}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold bg-green-500/15 text-green-400 px-2 py-1 rounded-full">
                    {c.activeLots} lots
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          COUNTRIES — enriched
      ═══════════════════════════════════ */}
      <section id="countries" className="py-20 sm:py-28 bg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">{t("home.countriesTagline")}</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              {t("home.countriesTitle")}
            </h2>
            <p className="text-sage-500 text-lg mt-4 max-w-2xl mx-auto">
              {t("home.countriesDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="group bg-linen rounded-2xl p-5 text-center border border-sage-100/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-4xl block mb-3 transition-transform group-hover:scale-110 duration-300">
                  {country.flag}
                </span>
                <h3 className="font-heading text-sage-900 text-sm font-semibold">{country.name}</h3>
                <p className="text-sage-500 text-xs mt-1">{country.role}</p>
                <span className="mt-2 inline-block text-[10px] font-semibold text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full">
                  {country.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          TRUST — volume + outcome language
      ═══════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">{t("home.trustTagline")}</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              {t("home.trustTitle")}
            </h2>
          </div>

          {/* Volume metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {TRUST_METRICS.map((m) => (
              <div key={m.label}
                className="bg-white rounded-2xl p-6 text-center border border-sage-100/70 shadow-sm">
                <div className="font-heading text-sage-900 text-3xl font-bold">{m.value}</div>
                <div className="text-sage-500 text-sm mt-1">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Trust pillars — outcome language */}
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-sage-100/70">
              <div className="w-12 h-12 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6 text-sage-700" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-sage-900 text-xl font-semibold mb-3">
                Bank-grade security
              </h3>
              <ul className="space-y-2.5">
                {[
                  "End-to-end encrypted accounts and transactions",
                  "Tamper-proof ownership tokens (QR + digital signature)",
                  "Every API request validated and rate-limited",
                  "Brute-force and session-hijack protection",
                  "Regular third-party security audits",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sage-600 text-sm">
                    <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-sage-100/70">
              <div className="w-12 h-12 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-5">
                <Scale className="w-6 h-6 text-sage-700" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-sage-900 text-xl font-semibold mb-3">
                Compliance built-in
              </h3>
              <ul className="space-y-2.5">
                {[
                  "KYC verification per country — no unverified trading",
                  "Local payment gateways for every supported country",
                  "Automatic geo-compliant tax calculation",
                  "Immutable audit trail on every trade and payment",
                  "Data privacy under DPDPA (India) and GDPR",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sage-600 text-sm">
                    <Check className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Support CTA inline */}
          <div className="mt-12 bg-sage-50 rounded-2xl border border-sage-100 p-6 max-w-2xl mx-auto text-center">
            <p className="text-sage-700 font-semibold mb-3">Questions before you trade?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp us
              </a>
              <a href="mailto:krishibridge@gmail.com"
                className="inline-flex items-center gap-2 border border-sage-300 text-sage-700 hover:bg-sage-100 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
                <Mail className="w-4 h-4" /> Email support
              </a>
              <a href="tel:+919126840029"
                className="inline-flex items-center gap-2 border border-sage-300 text-sage-700 hover:bg-sage-100 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
                <Phone className="w-4 h-4" /> Call us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FINAL CTA — persona-aware
      ═══════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-sage-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-125 h-125 rounded-full bg-sage-600/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-100 h-100 rounded-full bg-sage-500/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-script text-sage-200 text-xl mb-3">{t("home.ctaTagline")}</p>
          <h2 className="font-heading text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-sage-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {t("home.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/register?role=farmer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-sage-800 font-semibold px-8 py-4 rounded-full hover:bg-sage-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base">
              <Sprout className="w-4 h-4" /> List your harvest
            </Link>
            <Link href="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-base">
              <Users className="w-4 h-4" /> Browse today&apos;s lots
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sage-300 text-sm">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> No upfront fee</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> KYC in 24 hours</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp onboarding</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER — full
      ═══════════════════════════════════ */}
      <footer className="bg-sage-900 text-sage-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white rounded-xl p-1">
                  <BrandLogo size={36} />
                </div>
              </div>
              <p className="text-sage-400 text-sm leading-relaxed mb-5 max-w-xs">
                A verified, multi-country digital marketplace for South Asian and Gulf agricultural trade.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sage-400 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4 shrink-0" /> +91 91268 40029
                </a>
                <a href="mailto:krishibridge@gmail.com"
                  className="flex items-center gap-2 text-sage-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 shrink-0" /> krishibridge@gmail.com
                </a>
              </div>
              <div className="mt-5 flex gap-2 text-sage-500 text-xs">
                🇮🇳 🇳🇵 🇧🇹 🇦🇪 🇸🇦 🇴🇲
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sage-200 font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#commodities" className="hover:text-white transition-colors">Commodities</a></li>
                <li><a href="#countries" className="hover:text-white transition-colors">Countries</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sage-200 font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><span className="text-sage-600 cursor-default">About us</span></li>
                <li><span className="text-sage-600 cursor-default">Fees &amp; pricing</span></li>
                <li><span className="text-sage-600 cursor-default">Security</span></li>
                <li><span className="text-sage-600 cursor-default">Careers</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sage-200 font-semibold text-sm mb-4">Legal &amp; Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><span className="text-sage-600 cursor-default">Terms of Service</span></li>
                <li><span className="text-sage-600 cursor-default">Privacy Policy</span></li>
                <li><span className="text-sage-600 cursor-default">Compliance</span></li>
                <li>
                  <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-sage-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sage-600">
            <p>© 2026 Krishibridge — Himalayan Commodity Exchange Platform. {t("home.footerCopy")}</p>
            <p>Made in India · Serving South Asia &amp; the Gulf</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
