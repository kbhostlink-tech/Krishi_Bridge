"use client";

import { useState } from "react";
import { ArrowRight, Mail, Menu, MessageCircle, Phone, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { localeFlags, localeNames, routing } from "@/i18n/routing";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPublicLabels } from "@/lib/public-page-content";

export function PublicSiteShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const labels = getPublicLabels(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    if (typeof window !== "undefined") localStorage.setItem("manual_locale", "true");
    router.replace(pathname, { locale: newLocale });
  };

  const navLinks = [
    { href: "/#features", label: t("home.navFeatures") },
    { href: "/#how-it-works", label: t("home.navHowItWorks") },
    { href: "/#commodities", label: t("home.navCommodities") },
    { href: "/#countries", label: t("home.navCountries") },
    { href: "/about", label: labels.about },
    { href: "/contact", label: labels.contact },
  ];

  const companyLinks = [
    { href: "/about", label: labels.about },
    { href: "/fees", label: labels.fees },
    { href: "/security", label: labels.security },
    { href: "/contact", label: labels.contact },
  ];

  const legalLinks = [
    { href: "/terms-and-conditions", label: labels.terms },
    { href: "/privacy-policy", label: labels.privacy },
    { href: "/cookie-policy", label: labels.cookies },
    { href: "/disclaimer", label: labels.disclaimer },
    { href: "/regulatory-compliance", label: labels.compliance },
    { href: "/anti-fraud-policy", label: labels.antiFraud },
  ];

  return (
    <div className="min-h-screen bg-linen text-sage-900">
      <div className="hidden bg-sage-900 py-2 text-xs text-sage-300 sm:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{t("home.supportWhatsApp")}</span>
            </a>
            <a href="tel:+919126840029" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Phone className="h-3.5 w-3.5" />
              +91 91268 40029
            </a>
            <a href="mailto:krishibridge@gmail.com" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Mail className="h-3.5 w-3.5" />
              krishibridge@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-sage-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span>{t("home.supportLiveLots")}</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-sage-100/70 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Krishibridge home">
              <BrandLogo size={40} priority />
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full px-3.5 py-2 text-[13px] font-medium text-sage-600 transition-colors hover:bg-sage-50 hover:text-sage-900">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-sage-200 px-3 text-sm outline-none hover:bg-sage-50">
                  <span>{localeFlags[locale]}</span>
                  <span className="text-xs font-medium text-sage-600">{locale.toUpperCase()}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {routing.locales.map((loc) => (
                    <DropdownMenuItem key={loc} onClick={() => switchLocale(loc)} className={loc === locale ? "bg-sage-50 font-medium" : ""}>
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/login" className="px-5 py-2 text-sm font-medium text-sage-700 transition-colors hover:text-sage-900">
                {t("nav.login")}
              </Link>
              <Link href="/register" className="inline-flex items-center gap-1.5 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sage-800 hover:shadow-md">
                {t("nav.register")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 cursor-pointer items-center gap-1 rounded-full border border-sage-200 px-2 outline-none hover:bg-sage-50">
                  <span>{localeFlags[locale]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {routing.locales.map((loc) => (
                    <DropdownMenuItem key={loc} onClick={() => switchLocale(loc)} className={loc === locale ? "bg-sage-50 font-medium" : ""}>
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/login" className="px-3 py-2 text-sm font-medium text-sage-700">
                {t("nav.login")}
              </Link>
              <button onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center rounded-xl text-sage-700 transition-colors hover:bg-sage-100" aria-label="Toggle menu">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="space-y-0.5 border-t border-sage-100 py-3 pb-4 md:hidden">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-50">
                  {link.label}
                </Link>
              ))}
              <div className="px-4 pt-3">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full bg-sage-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-800">
                  {t("nav.register")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {children}

      <footer className="bg-sage-900 text-sage-400">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-16 lg:px-8">
          <div className="mb-8 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-white p-1">
                  <BrandLogo size={32} />
                </div>
              </div>
              <p className="mb-3 max-w-xs text-xs leading-snug text-sage-400 sm:text-sm">{t("home.footerDesc")}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm">
                <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sage-400 transition-colors hover:text-white">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" /> +91 91268 40029
                </a>
                <a href="mailto:krishibridge@gmail.com" className="flex items-center gap-1.5 text-sage-400 transition-colors hover:text-white">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> krishibridge@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            <div>
              <h4 className="mb-4 text-sm font-semibold text-sage-200">{labels.platform}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/marketplace" className="transition-colors hover:text-white">{t("home.footerMarketplace")}</Link></li>
                <li><Link href="/#features" className="transition-colors hover:text-white">{t("home.navFeatures")}</Link></li>
                <li><Link href="/#how-it-works" className="transition-colors hover:text-white">{t("home.navHowItWorks")}</Link></li>
                <li><Link href="/#commodities" className="transition-colors hover:text-white">{t("home.navCommodities")}</Link></li>
                <li><Link href="/#countries" className="transition-colors hover:text-white">{t("home.navCountries")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-sage-200">{labels.company}</h4>
              <ul className="space-y-2.5 text-sm">
                {companyLinks.map((link) => (
                  <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-sage-200">{labels.legal}</h4>
              <ul className="space-y-2.5 text-sm">
                {legalLinks.map((link) => (
                  <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>
                ))}
                <li>
                  <a href="https://wa.me/919126840029" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
                    <MessageCircle className="h-3.5 w-3.5" /> {t("home.supportWhatsApp")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-sage-800 pt-4 text-center text-[11px] text-sage-600 sm:mt-12 sm:flex-row sm:gap-4 sm:pt-8 sm:text-left sm:text-xs">
            <p>© 2026 Krishibridge - {t("home.footerProduct")}. {t("home.footerCopy")}</p>
            <p>{t("home.footerServing")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
