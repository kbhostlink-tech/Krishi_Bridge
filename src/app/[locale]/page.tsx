import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const COMMODITIES = [
  { name: "Large Cardamom", emoji: "🫛", origin: "Sikkim, Nepal" },
  { name: "Darjeeling Tea", emoji: "🍵", origin: "India, Nepal" },
  { name: "Ginger", emoji: "🫚", origin: "India, Bhutan" },
  { name: "Turmeric", emoji: "🌿", origin: "India, Nepal" },
  { name: "Black Pepper", emoji: "🌶️", origin: "India, Oman" },
  { name: "Coffee", emoji: "☕", origin: "India, UAE" },
  { name: "Saffron", emoji: "🌸", origin: "India, Saudi Arabia" },
  { name: "Cinnamon", emoji: "🪵", origin: "India, Nepal" },
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
  { value: "24/7", label: "Trading" },
  { value: "100%", label: "Verified" },
];

export default function LocaleHomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-linen">
      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-sage-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-sage-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">A</span>
              </div>
              <span className="font-heading text-sage-900 text-lg font-bold tracking-tight">
                AgriExchange
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <a href="#features" className="px-4 py-2 rounded-full text-sm font-medium text-sage-600 hover:text-sage-800 hover:bg-sage-50/70 transition-colors">
                Features
              </a>
              <a href="#commodities" className="px-4 py-2 rounded-full text-sm font-medium text-sage-600 hover:text-sage-800 hover:bg-sage-50/70 transition-colors">
                Commodities
              </a>
              <a href="#how-it-works" className="px-4 py-2 rounded-full text-sm font-medium text-sage-600 hover:text-sage-800 hover:bg-sage-50/70 transition-colors">
                How It Works
              </a>
              <a href="#countries" className="px-4 py-2 rounded-full text-sm font-medium text-sage-600 hover:text-sage-800 hover:bg-sage-50/70 transition-colors">
                Countries
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-5 py-2 text-sm font-medium text-sage-700 hover:text-sage-900 transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-2.5 bg-sage-700 hover:bg-sage-800 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {t("nav.register")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-sage-100/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-terracotta/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-sage-50/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200/60 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
              <span className="text-sage-700 text-xs font-medium tracking-wide uppercase">
                Trusted across 6 nations
              </span>
            </div>

            <p className="font-script text-terracotta text-xl sm:text-2xl mb-3">
              {t("app.tagline")}
            </p>

            <h1 className="font-heading text-sage-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Where Farmers Meet
              <br />
              <span className="text-sage-500">Global Buyers</span>
            </h1>

            <p className="text-sage-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The premier agricultural commodity exchange connecting farmers,
              warehouse operators, and buyers across India, Nepal, Bhutan, UAE,
              Saudi Arabia, and Oman.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-sage-700 hover:bg-sage-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base shadow-lg shadow-sage-700/20 hover:shadow-xl hover:shadow-sage-700/30 hover:-translate-y-0.5"
              >
                Start Trading Today
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-sage-300 text-sage-700 hover:border-sage-500 hover:bg-sage-50 font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base"
              >
                {t("nav.login")}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-2xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-heading text-sage-900 text-2xl sm:text-3xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-sage-500 text-sm mt-0.5">{stat.label}</div>
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
            <p className="font-script text-terracotta text-lg mb-2">Why AgriExchange</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              Built for Agricultural Trade
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🔍",
                title: "Quality Verified",
                desc: "Every lot passes warehouse quality checks — moisture, grade, and traceability verified before listing.",
              },
              {
                icon: "📊",
                title: "Real-Time Auctions",
                desc: "Live bidding with anti-sniping protection, proxy bidding, and reserve prices for fair price discovery.",
              },
              {
                icon: "📋",
                title: "RFQ Negotiations",
                desc: "Buyers post requirements, sellers compete with quotes. Multi-round negotiation until the best deal is struck.",
              },
              {
                icon: "🪙",
                title: "Token Ownership",
                desc: "Digital ownership tokens with HMAC-signed QR codes for tamper-proof warehouse redemption.",
              },
              {
                icon: "💱",
                title: "Multi-Currency",
                desc: "Trade in INR, NPR, BTN, AED, SAR, OMR, or USD with real-time FX rates from Wise API.",
              },
              {
                icon: "🌐",
                title: "5 Languages + RTL",
                desc: "Full support for English, Hindi, Nepali, Dzongkha, and Arabic with right-to-left layouts.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-linen rounded-3xl p-7 sm:p-8 shadow-sm border border-sage-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-heading text-sage-900 text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sage-500 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-script text-terracotta text-lg mb-2">Simple & Transparent</p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              How It Works
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Register & Verify",
                desc: "Create your account as a Farmer or Buyer. Complete KYC with country-specific documents for verified trading.",
                icon: "👤",
              },
              {
                step: "02",
                title: "List or Browse Commodities",
                desc: "Farmers submit produce through warehouse intake with quality checks. Buyers browse the verified marketplace.",
                icon: "📦",
              },
              {
                step: "03",
                title: "Bid, Quote, or Negotiate",
                desc: "Place bids in live auctions or submit RFQ quotes. Multi-round negotiations help find the perfect price.",
                icon: "🤝",
              },
              {
                step: "04",
                title: "Pay & Receive Token",
                desc: "Secure multi-gateway payments with tax compliance. Receive a digital ownership token with signed QR code.",
                icon: "🪙",
              },
              {
                step: "05",
                title: "Redeem at Warehouse",
                desc: "Present your QR code at the designated warehouse. Staff verifies the token and releases your commodity.",
                icon: "🏭",
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 sm:gap-8 mb-10 last:mb-0">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sage-700 text-white flex items-center justify-center font-heading text-lg font-bold shrink-0">
                    {item.icon}
                  </div>
                  {i < 4 && (
                    <div className="w-0.5 flex-1 bg-sage-200 mt-3" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-10 last:pb-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sage-400 text-xs font-medium font-heading tracking-widest">
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="font-heading text-sage-900 text-xl font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sage-500 leading-relaxed max-w-lg">
                    {item.desc}
                  </p>
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
            <p className="font-script text-terracotta-light text-lg mb-2">
              What We Trade
            </p>
            <h2 className="font-heading text-white text-3xl sm:text-4xl font-bold">
              Premium Agricultural Commodities
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {COMMODITIES.map((commodity) => (
              <div
                key={commodity.name}
                className="bg-sage-800/50 backdrop-blur-sm border border-sage-700/40 rounded-2xl p-5 sm:p-6 hover:bg-sage-800/80 transition-all duration-300 group"
              >
                <span className="text-3xl sm:text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                  {commodity.emoji}
                </span>
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
            <p className="font-script text-terracotta text-lg mb-2">
              Cross-Border Trading
            </p>
            <h2 className="font-heading text-sage-900 text-3xl sm:text-4xl font-bold">
              Active in 6 Countries
            </h2>
            <p className="text-sage-500 text-lg mt-4 max-w-2xl mx-auto">
              Trade seamlessly across South Asia and the Middle East with
              localized payment gateways and tax compliance.
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

      {/* ═══ TRUST SECTION ═══ */}
      <section className="py-20 sm:py-28 bg-linen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-8 border border-sage-100/60">
                <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="font-heading text-sage-900 text-xl font-semibold mb-3">
                  Security First
                </h3>
                <ul className="space-y-2.5">
                  {[
                    "bcrypt password hashing (cost 12)",
                    "JWT with 15-min expiry + refresh rotation",
                    "HMAC-SHA256 signed QR tokens",
                    "Zod validation on every API route",
                    "Rate limiting & brute-force protection",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sage-600 text-sm">
                      <svg className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-sage-100/60">
                <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-2xl">⚖️</span>
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
                      <svg className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
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
            Join the Marketplace Today
          </h2>
          <p className="text-sage-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re a farmer looking for the best price or a buyer
            sourcing premium commodities, AgriExchange connects you with verified
            partners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-sage-800 font-semibold px-8 py-4 rounded-full transition-all duration-200 text-base hover:bg-sage-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Free Account
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sage-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-heading font-bold text-xs">A</span>
              </div>
              <span className="font-heading text-white text-base font-bold">
                AgriExchange
              </span>
            </div>
            <div className="flex items-center gap-4">
              {COUNTRIES.map((c) => (
                <span key={c.code} className="text-lg" title={c.name}>
                  {c.flag}
                </span>
              ))}
            </div>
            <p className="text-sage-400 text-sm">
              &copy; {new Date().getFullYear()} AgriExchange. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
