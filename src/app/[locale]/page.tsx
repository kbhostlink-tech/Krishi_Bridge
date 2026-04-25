"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  Lock,
  ShieldCheck,
  Users,
  MapPin,
  Sprout,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const COMMODITIES = [
  {
    name: "Black Cardamom",
    origin: "Sikkim · East Nepal · Bhutan",
    priceBand: "₹1,680–₹2,100/kg",
    activeLots: 18,
    image: "/black_cardamom.png",
    accent: "from-sage-700 to-sage-900",
    tag: "Highland Spice",
  },
  {
    name: "Orthodox Tea",
    origin: "Darjeeling · Ilam · Dhankuta",
    priceBand: "₹720–₹1,040/kg",
    activeLots: 14,
    image: "/orthodoxtea.png",
    accent: "from-terracotta to-amber-700",
    tag: "Single-origin",
  },
  {
    name: "Black Tea",
    origin: "Assam · Terai · East Nepal",
    priceBand: "₹380–₹560/kg",
    activeLots: 22,
    image: "/blacktea.png",
    accent: "from-amber-800 to-stone-900",
    tag: "Daily Brew",
  },
];

const COUNTRIES = [
  {
    code: "IN",
    name: "India",
    role: "Origin & Buyer",
    currency: "INR",
    image: "https://flagcdn.com/w640/in.png",
    blurb: "Sikkim cardamom, Assam & Darjeeling tea",
  },
  {
    code: "NP",
    name: "Nepal",
    role: "Origin & Buyer",
    currency: "NPR",
    image: "https://flagcdn.com/w640/np.png",
    blurb: "Ilam orthodox tea, East Nepal cardamom",
  },
  {
    code: "BT",
    name: "Bhutan",
    role: "Origin",
    currency: "BTN",
    image: "https://flagcdn.com/w640/bt.png",
    blurb: "High-altitude cardamom, Dzongkha-first onboarding",
  },
];

const TRUST_METRICS = [
  { value: "₹2.4Cr+",   label: "Total Volume Traded" },
  { value: "340+",       label: "Verified Lots Closed" },
  { value: "600+",       label: "Registered Traders" },
  { value: "99.9%",      label: "Platform Uptime" },
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

  // Hero image carousel — cycles through 3 backgrounds with crazy transitions
  const HERO_IMAGES = ["/kbhero1.png", "/kbherobg2.png", "/kbherobg3.png"] as const;
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setHeroSlide((s) => (s + 1) % HERO_IMAGES.length);
    }, 5200);
    return () => clearInterval(id);
  }, [HERO_IMAGES.length]);

  const switchLocale = (newLocale: string) => {
    if (typeof window !== "undefined") localStorage.setItem("manual_locale", "true");
    router.replace(pathname, { locale: newLocale });
  };

  const NAV_LINKS = [
    { href: "#features",    label: t("home.navFeatures") },
    { href: "#how-it-works",label: t("home.navHowItWorks") },
    { href: "#commodities", label: t("home.navCommodities") },
    { href: "#countries",   label: t("home.navCountries") },
  ];

  // Launch markets: India, Nepal, Bhutan + English. Filter the locale picker
  // to the four supported launch languages while keeping Arabic translations
  // present in the routing layer.
  const LAUNCH_LOCALES = ["en", "hi", "ne", "dz"] as const;
  const launchLocales = routing.locales.filter((l: string) => (LAUNCH_LOCALES as readonly string[]).includes(l));

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
                  {launchLocales.map((loc: string) => (
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
                  {launchLocales.map((loc: string) => (
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
          HERO — fits viewport, grid-wipe transition,
          inline circular stats. Single full-bleed
          screen with everything visible above fold.
      ═══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-sage-900 min-h-[calc(100svh-72px)] flex items-center">
        {/* Background carousel */}
        <div className="absolute inset-0 z-0">
          {HERO_IMAGES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 ${i === heroSlide ? "opacity-100" : "opacity-0"}`}
              aria-hidden={i !== heroSlide}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                priority={i === 0}
                className={`object-cover ${i === heroSlide ? "kb-hero-drift" : ""}`}
              />
            </div>
          ))}

          {/* Grid wipe overlay — re-mounts on slide change to play tile dissolve */}
          <div
            key={`grid-${heroSlide}`}
            aria-hidden
            className="absolute inset-0 z-5 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 grid-rows-5 pointer-events-none"
          >
            {Array.from({ length: 50 }).map((_, idx) => {
              const cols = 10;
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const delay = (col + row) * 55;
              return (
                <div
                  key={idx}
                  className="kb-grid-tile"
                  style={{ animationDelay: `${delay}ms` }}
                />
              );
            })}
          </div>

          {/* Lightweight tints for legibility */}
          <div aria-hidden className="absolute inset-0 z-10 bg-sage-900/35" />
          <div aria-hidden className="absolute inset-0 z-10 bg-linear-to-b from-sage-900/10 via-sage-900/15 to-sage-900/55" />
        </div>

        {/* Slide progress dots */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-2">
          {HERO_IMAGES.map((src, i) => (
            <button
              key={src}
              onClick={() => setHeroSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === heroSlide ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] text-terracotta-light mb-2 sm:mb-3 drop-shadow">
              {t("app.tagline")}
            </span>
            <h1 className="font-sans text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-2 sm:mb-3 drop-shadow-lg">
              Verified Himalayan commodities.
              <br />
              <span className="text-sage-100">Tokenised trade. Three countries.</span>
            </h1>
            <p className="text-sage-50/90 text-xs sm:text-base max-w-2xl mx-auto mb-4 sm:mb-6 leading-snug drop-shadow px-2">
              A multi-country digital marketplace connecting farmers, sellers, and buyers through transparent, secure, and efficient trading of agricultural commodities across South Asia and the Middle East.
            </p>

            {/* Persona toggle + CTAs */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative inline-flex items-center bg-white/15 backdrop-blur-md rounded-full p-1 border border-white/25 shadow-2xl">
                <span
                  aria-hidden
                  className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-xl transition-all duration-500 kb-persona-pop ${
                    activePersona === "farmer" ? "left-1" : "left-[calc(50%+0rem)]"
                  }`}
                  key={activePersona}
                  style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                />
                <button
                  onClick={() => setActivePersona("farmer")}
                  className={`relative z-10 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold transition-colors duration-300 ${
                    activePersona === "farmer" ? "text-sage-900" : "text-white/90 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sprout className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Farmer / Seller
                  </span>
                </button>
                <button
                  onClick={() => setActivePersona("buyer")}
                  className={`relative z-10 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-bold transition-colors duration-300 ${
                    activePersona === "buyer" ? "text-sage-900" : "text-white/90 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Buyer / Importer
                  </span>
                </button>
              </div>

              <div
                key={activePersona}
                className="kb-persona-flip flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto px-4 sm:px-0"
              >
                {activePersona === "farmer" ? (
                  <>
                    <Link
                      href="/register?role=farmer"
                      className="inline-flex items-center justify-center gap-2 bg-white text-sage-900 hover:bg-sage-50 font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all shadow-2xl shadow-black/30 hover:-translate-y-0.5 text-xs sm:text-base"
                    >
                      List your harvest <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                    <Link
                      href="/marketplace"
                      className="inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta/90 text-white font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all shadow-2xl shadow-black/30 hover:-translate-y-0.5 text-xs sm:text-base"
                    >
                      See how it works
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/marketplace"
                      className="inline-flex items-center justify-center gap-2 bg-white text-sage-900 hover:bg-sage-50 font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all shadow-2xl shadow-black/30 hover:-translate-y-0.5 text-xs sm:text-base"
                    >
                      Browse today&apos;s lots <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                    <Link
                      href="/register?role=buyer"
                      className="inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta/90 text-white font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all shadow-2xl shadow-black/30 hover:-translate-y-0.5 text-xs sm:text-base"
                    >
                      Create buyer account
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Compact circular stats — inline in hero */}
            <div className="mt-6 sm:mt-10 flex items-center justify-center gap-4 sm:gap-10 flex-wrap">
              {[
                { value: "3", label: "Countries",   icon: "/countries.png" },
                { value: "3", label: "Commodities", icon: "/commodities.png" },
                { value: "4", label: "Languages",   icon: "/languages.png" },
                { value: "4", label: "Currencies",  icon: "/currencies.png" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="kb-stat-rise group flex flex-col items-center"
                  style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-xl flex items-center justify-center transition-all duration-500 hover:bg-white/25 hover:scale-110 hover:-translate-y-1">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-linear-to-br from-terracotta/0 to-terracotta/0 group-hover:from-terracotta/30 transition-all duration-500"
                    />
                    <Image
                      src={stat.icon}
                      alt=""
                      width={32}
                      height={32}
                      className="relative w-7 h-7 sm:w-9 sm:h-9 object-contain brightness-0 invert opacity-90"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-white text-sage-900 text-[10px] sm:text-xs font-extrabold tabular-nums rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg ring-2 ring-sage-900/20">
                      {stat.value}
                    </span>
                  </div>
                  <span className="mt-2 text-white/90 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] drop-shadow">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FEATURES — uniform 6-card grid (3×2 desktop, 2×3 phone)
      ═══════════════════════════════════ */}
      <section id="features" className="bg-sand py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-terracotta mb-3">
              {t("home.featuresTagline")}
            </span>
            <h2 className="font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-sage-500 text-base mt-4 max-w-xl mx-auto">
              {t("home.featuresDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                Icon: QrCode,
                title: t("home.feature4Title"),
                desc: "Digital ownership tokens linked to physical lots — scan the QR at any partner warehouse and walk away with your commodity.",
              },
              {
                Icon: Languages,
                title: "4 Languages, Local-first",
                desc: "Native English, Hindi, Nepali and Dzongkha — onboarding farmers in their own language across India, Nepal and Bhutan.",
              },
              {
                Icon: BarChart2,
                title: t("home.feature2Title"),
                desc: "Live bidding with anti-sniping protection and proxy bids — so the best price wins, not the fastest click.",
              },
              {
                Icon: FileText,
                title: t("home.feature3Title"),
                desc: "Post your buying requirement, receive competing quotes, negotiate across multiple rounds until the deal is done.",
              },
              {
                Icon: BadgeCheck,
                title: t("home.feature1Title"),
                desc: "Every lot inspected for moisture, grade and origin before appearing on the marketplace. No surprises on delivery.",
              },
              {
                Icon: Globe,
                title: t("home.feature5Title"),
                desc: "Trade in INR, NPR, BTN or USD — real-time FX rates and country-specific payment gateways built in.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group relative bg-white rounded-3xl p-6 sm:p-7 border border-sage-100 hover:border-sage-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col min-h-65"
              >
                {/* Circular accent — top-right, scales on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-linear-to-br from-terracotta/25 to-sage-300/30 transition-all duration-500 group-hover:scale-[2.6] group-hover:from-terracotta/35 group-hover:to-sage-400/35"
                />

                <div className="relative w-12 h-12 bg-sage-700/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sage-700 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-sage-700 group-hover:text-white transition-colors duration-300" strokeWidth={1.6} />
                </div>
                <h3 className="relative font-sans text-sage-900 text-base sm:text-lg font-bold mb-2 tracking-tight">
                  {title}
                </h3>
                <p className="relative text-sage-500 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          PERSONAS — modern split with imagery
      ═══════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-terracotta mb-3">
              Who is this for?
            </span>
            <h2 className="font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built for every side of the trade
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Farmer / Seller card */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-sage-800 text-white shadow-xl shadow-sage-900/10">
              <div className="absolute inset-0 bg-linear-to-br from-sage-900 via-sage-800 to-sage-700" />
              <div
                aria-hidden
                className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-terracotta/20 blur-3xl group-hover:bg-terracotta/30 transition-colors"
              />
              <div className="relative p-8 sm:p-10 lg:p-12 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center ring-1 ring-white/20">
                    <Sprout className="w-7 h-7 text-white" strokeWidth={1.6} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-sage-200">For sellers</span>
                </div>
                <h3 className="font-sans text-white text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  Farmers &amp; Aggregators
                </h3>
                <p className="text-sage-100/90 text-base mb-8 leading-relaxed max-w-md">
                  List your harvest, reach Gulf and regional buyers directly, and receive verified payments — without brokers eating your margin.
                </p>
                <ul className="space-y-3 mb-10">
                  {[
                    "Warehouse-backed lot listing with quality verification",
                    "Live auctions + RFQ to maximise your price",
                    "Instant payment on lot closure, escrow-protected",
                    "Track your lot from intake to buyer redemption",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sage-50 text-sm">
                      <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?role=farmer"
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-white text-sage-900 font-bold px-6 py-3.5 rounded-full hover:bg-sage-50 hover:gap-3 transition-all w-full sm:w-fit"
                >
                  List your harvest <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Buyer / Importer card */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-white border border-sage-100 shadow-xl shadow-sage-900/5">
              <div
                aria-hidden
                className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sage-200/40 blur-3xl group-hover:bg-sage-300/50 transition-colors"
              />
              <div
                aria-hidden
                className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-terracotta/10 blur-3xl"
              />
              <div className="relative p-8 sm:p-10 lg:p-12 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-sage-700 rounded-2xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" strokeWidth={1.6} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta">For buyers</span>
                </div>
                <h3 className="font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  Buyers &amp; Importers
                </h3>
                <p className="text-sage-600 text-base mb-8 leading-relaxed max-w-md">
                  Source verified Himalayan produce at transparent prices. Bid in live auctions or post RFQs and let sellers compete for your business.
                </p>
                <ul className="space-y-3 mb-10">
                  {[
                    "Browse lots with lab-verified quality reports",
                    "Bid or post RFQs — you control the process",
                    "Digital ownership token, redeemable at warehouse",
                    "Multi-currency settlement: INR, NPR, BTN, USD",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sage-700 text-sm">
                      <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-sage-700" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?role=buyer"
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-sage-700 text-white font-bold px-6 py-3.5 rounded-full hover:bg-sage-800 hover:gap-3 transition-all w-full sm:w-fit"
                >
                  Browse today&apos;s lots <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          HOW IT WORKS — elegant zigzag
      ═══════════════════════════════════ */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-sand border-t border-sage-100/60 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-160 h-160 rounded-full bg-sage-100/40 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-terracotta mb-3">
              {t("home.howTagline")}
            </span>
            <h2 className="font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("home.howTitle")}
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Center vertical rail (desktop only) */}
            <div
              aria-hidden
              className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-sage-300 to-transparent"
            />

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
            ].map(({ Icon, step, title, desc }, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={step}
                  className={`relative grid lg:grid-cols-2 gap-4 lg:gap-10 items-center mb-6 lg:mb-12 last:mb-0`}
                >
                  {/* Mobile: horizontal layout (icon + content side-by-side) */}
                  {/* Card column */}
                  <div className={`${isLeft ? "lg:order-1 lg:pr-10 lg:text-right" : "lg:order-2 lg:pl-10"}`}>
                    <div
                      className={`group relative inline-block w-full bg-white rounded-3xl p-5 sm:p-6 border border-sage-100 hover:border-sage-300 hover:shadow-2xl hover:shadow-sage-900/5 transition-all duration-300 ${
                        isLeft ? "lg:rounded-tr-none" : "lg:rounded-tl-none"
                      }`}
                    >
                      <div className={`flex items-center gap-3 mb-2 ${isLeft ? "lg:justify-end" : ""}`}>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-terracotta">
                          {t("home.stepPrefix")} {step}
                        </span>
                        <span className="h-px flex-1 max-w-12 bg-sage-200" />
                      </div>
                      <h3 className="font-sans text-sage-900 text-lg sm:text-xl font-extrabold tracking-tight mb-2">
                        {title}
                      </h3>
                      <p className="text-sage-500 leading-snug text-sm">{desc}</p>
                    </div>
                  </div>

                  {/* Icon medallion column */}
                  <div className={`${isLeft ? "lg:order-2" : "lg:order-1"} hidden lg:flex lg:justify-center`}>
                    <div className="relative">
                      <div
                        aria-hidden
                        className="absolute inset-0 rounded-3xl bg-sage-300/30 blur-xl"
                      />
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-linear-to-br from-sage-700 to-sage-900 flex items-center justify-center shadow-lg shadow-sage-900/30">
                        <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-white" strokeWidth={1.6} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-terracotta text-white text-[11px] font-bold flex items-center justify-center shadow-lg ring-4 ring-sand">
                        {step}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          COMMODITIES — image-led cards
      ═══════════════════════════════════ */}
      <section id="commodities" className="bg-sage-700 py-16 sm:py-20 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-20 w-md h-112 rounded-full bg-sage-500/30 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-terracotta/10 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-terracotta-light mb-3">
                {t("home.commoditiesTagline")}
              </span>
              <h2 className="font-sans text-white text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t("home.commoditiesTitle")}
              </h2>
            </div>
            <Link
              href="/marketplace"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-sage-900 hover:bg-sage-50 text-sm font-bold px-5 py-3 rounded-full transition-colors"
            >
              View all lots <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {COMMODITIES.map((c) => (
              <Link
                key={c.name}
                href="/marketplace"
                className="group relative rounded-3xl overflow-hidden bg-sage-800/70 border border-sage-700/60 hover:border-sage-500 hover:-translate-y-1 transition-all duration-500 shadow-xl shadow-black/20"
              >
                {/* Image area */}
                <div className="relative aspect-4/3 overflow-hidden bg-sage-900">
                  <div className={`absolute inset-0 bg-linear-to-br ${c.accent} opacity-30 mix-blend-multiply z-10`} />
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-sage-900 to-transparent z-10" />
                  <span className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-sage-900 text-[11px] font-bold px-3 py-1 rounded-full">
                    <Leaf className="w-3 h-3" /> {c.tag}
                  </span>
                  <span className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 bg-green-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {c.activeLots} live
                  </span>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-7">
                  <h3 className="font-sans text-white text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                    {c.name}
                  </h3>
                  <p className="text-sage-300 text-xs flex items-center gap-1.5 mb-5">
                    <MapPin className="w-3.5 h-3.5" /> {c.origin}
                  </p>
                  <div className="flex items-end justify-between gap-3 pt-4 border-t border-sage-700/60">
                    <div>
                      <p className="text-sage-400 text-[10px] uppercase tracking-[0.2em] mb-1">
                        Indicative band
                      </p>
                      <p className="text-white text-base font-bold tabular-nums">{c.priceBand}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sage-200 text-xs font-semibold group-hover:text-white group-hover:gap-2 transition-all">
                      Trade now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          COUNTRIES — 3 launch markets with flag imagery
      ═══════════════════════════════════ */}
      <section id="countries" className="py-14 sm:py-20 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-terracotta mb-3">
              {t("home.countriesTagline")}
            </span>
            <h2 className="font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Active in 3 Countries
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="group relative rounded-3xl overflow-hidden bg-white border border-sage-100 hover:border-sage-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sage-900/10 transition-all duration-500"
              >
                {/* Flag image */}
                <div className="relative aspect-5/3 overflow-hidden bg-sage-100">
                  <Image
                    src={country.image}
                    alt={`Flag of ${country.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-sage-900/30 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur text-sage-900 text-[11px] font-bold px-3 py-1.5 rounded-full font-mono">
                    {country.code}
                  </span>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-sans text-sage-900 text-xl sm:text-2xl font-extrabold tracking-tight">
                      {country.name}
                    </h3>
                    <span className="inline-block text-[10px] font-bold text-sage-700 bg-sage-100 px-2.5 py-1 rounded-full font-mono">
                      {country.currency}
                    </span>
                  </div>
                  <p className="text-terracotta text-xs font-bold uppercase tracking-[0.18em] mb-3">
                    {country.role}
                  </p>
                  <p className="text-sage-500 text-sm leading-relaxed">{country.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          TRUST — professional security/compliance
      ═══════════════════════════════════ */}
      <section className="py-14 sm:py-20 bg-sand relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sage-300 to-transparent"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-terracotta mb-3">
              {t("home.trustTagline")}
            </span>
            <h2 className="font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t("home.trustTitle")}
            </h2>
          </div>

          {/* Volume metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 max-w-5xl mx-auto">
            {TRUST_METRICS.map((m) => (
              <div
                key={m.label}
                className="relative bg-white rounded-2xl px-5 py-6 text-center border border-sage-100 overflow-hidden group hover:border-sage-300 transition-colors"
              >
                <span
                  aria-hidden
                  className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-terracotta/10 blur-xl group-hover:bg-terracotta/20 transition-colors"
                />
                <div className="relative font-sans text-sage-900 text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {m.value}
                </div>
                <div className="relative text-sage-500 text-xs sm:text-sm mt-1.5 font-medium">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Pillars */}
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              {
                Icon: ShieldCheck,
                title: "Bank-grade security",
                blurb: "Every account, every transaction, every token — encrypted, signed, and verifiable.",
                items: [
                  "End-to-end encrypted accounts and transactions",
                  "Tamper-proof ownership tokens (QR + digital signature)",
                  "Regular third-party security audits",
                ],
                accent: "bg-sage-700",
                badge: "Security",
              },
              {
                Icon: Scale,
                title: "Compliance built-in",
                blurb: "Local KYC, local payments, local tax — automatically applied to every trade.",
                items: [
                  "KYC verification per country — no unverified trading",
                  "Local payment gateways and geo-compliant tax",
                  "Immutable audit trail under DPDPA & GDPR",
                ],
                accent: "bg-terracotta",
                badge: "Compliance",
              },
            ].map(({ Icon, title, blurb, items, accent, badge }) => (
              <div
                key={title}
                className="relative bg-white rounded-3xl border border-sage-100 overflow-hidden hover:shadow-2xl hover:shadow-sage-900/5 transition-shadow"
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${accent}`} />
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 ${accent} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={1.6} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sage-500">
                      {badge}
                    </span>
                  </div>
                  <h3 className="font-sans text-sage-900 text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
                    {title}
                  </h3>
                  <p className="text-sage-500 text-sm mb-4 leading-snug">{blurb}</p>
                  <ul className="space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sage-700 text-sm">
                        <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-sage-700" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Support CTA inline */}
          <div className="mt-10 bg-white rounded-3xl border border-sage-100 p-5 sm:p-6 max-w-3xl mx-auto text-center shadow-sm">
            <p className="text-sage-900 font-bold text-lg mb-1">Questions before you trade?</p>
            <p className="text-sage-500 text-sm mb-5">Talk to a human — we onboard new traders by WhatsApp daily.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/919126840029"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp us
              </a>
              <a
                href="mailto:krishibridge@gmail.com"
                className="inline-flex items-center gap-2 border border-sage-300 text-sage-700 hover:bg-sage-100 text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                <Mail className="w-4 h-4" /> Email support
              </a>
              <a
                href="tel:+919126840029"
                className="inline-flex items-center gap-2 border border-sage-300 text-sage-700 hover:bg-sage-100 text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                <Phone className="w-4 h-4" /> Call us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FINAL CTA — image-backed hero
      ═══════════════════════════════════ */}
      <section className="relative isolate py-24 sm:py-32 overflow-hidden">
        {/* Background image */}
        <Image
          src="/Readytotradebg.png"
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className="object-cover -z-20"
        />
        {/* Overlay tints for legibility */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-sage-900/70" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-br from-sage-900/85 via-sage-800/60 to-transparent"
        />
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-md h-112 rounded-full bg-terracotta/20 blur-3xl -z-10"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-terracotta-light mb-5">
            {t("home.ctaTagline")}
          </span>
          <h2 className="font-sans text-white text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-sage-100/90 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("home.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/register?role=farmer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-sage-900 font-bold px-8 py-4 rounded-full hover:bg-sage-50 shadow-2xl shadow-black/20 hover:-translate-y-0.5 transition-all text-base"
            >
              <Sprout className="w-4 h-4" /> List your harvest
            </Link>
            <Link
              href="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta/90 text-white font-bold px-8 py-4 rounded-full hover:-translate-y-0.5 transition-all text-base shadow-2xl shadow-black/20"
            >
              <Users className="w-4 h-4" /> Browse today&apos;s lots
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sage-100/80 text-sm">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> No upfront fee</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> KYC in 24 hours</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp onboarding</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER — full (compact on mobile)
      ═══════════════════════════════════ */}
      <footer className="bg-sage-900 text-sage-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-6 sm:pb-8">
          {/* Brand row — always visible */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8 sm:mb-12">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white rounded-xl p-1">
                  <BrandLogo size={32} />
                </div>
              </div>
              <p className="text-sage-400 text-xs sm:text-sm leading-snug mb-3 max-w-xs">
                A verified, multi-country digital marketplace for South Asian and Gulf agricultural trade.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm">
                <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sage-400 hover:text-white transition-colors">
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" /> +91 91268 40029
                </a>
                <a href="mailto:krishibridge@gmail.com"
                  className="flex items-center gap-1.5 text-sage-400 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> krishibridge@gmail.com
                </a>
              </div>
              <div className="mt-3 text-base">🇮🇳 🇳🇵 🇧🇹</div>
            </div>
          </div>

          {/* Mobile: collapsible accordion sections — much shorter */}
          <div className="sm:hidden mb-4 border-y border-sage-800 divide-y divide-sage-800">
            {[
              {
                title: "Platform",
                links: [
                  { href: "/marketplace", label: "Marketplace", external: false },
                  { href: "#features", label: "Features", external: true },
                  { href: "#how-it-works", label: "How It Works", external: true },
                  { href: "#commodities", label: "Commodities", external: true },
                  { href: "#countries", label: "Countries", external: true },
                ],
              },
              {
                title: "Company",
                links: [
                  { href: "#", label: "About us", external: true },
                  { href: "#", label: "Fees & pricing", external: true },
                  { href: "#", label: "Security", external: true },
                  { href: "#", label: "Careers", external: true },
                ],
              },
              {
                title: "Legal & Support",
                links: [
                  { href: "#", label: "Terms of Service", external: true },
                  { href: "#", label: "Privacy Policy", external: true },
                  { href: "#", label: "Compliance", external: true },
                  { href: "https://wa.me/919126840029", label: "WhatsApp Support", external: true },
                ],
              },
            ].map((section) => (
              <details key={section.title} className="group py-3">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sage-200 font-semibold text-sm">
                  {section.title}
                  <span className="text-sage-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  {section.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sage-400 hover:text-white transition-colors"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {/* Desktop / tablet: 3-column grid */}
          <div className="hidden sm:grid grid-cols-3 gap-10 mb-12">
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

            <div>
              <h4 className="text-sage-200 font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><span className="text-sage-600 cursor-default">About us</span></li>
                <li><span className="text-sage-600 cursor-default">Fees &amp; pricing</span></li>
                <li><span className="text-sage-600 cursor-default">Security</span></li>
                <li><span className="text-sage-600 cursor-default">Careers</span></li>
              </ul>
            </div>

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

          <div className="border-t border-sage-800 pt-4 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs text-sage-600 text-center sm:text-left">
            <p>© 2026 Krishibridge — Himalayan Commodity Exchange Platform. {t("home.footerCopy")}</p>
            <p>Made in India · Serving South Asia &amp; the Gulf</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
