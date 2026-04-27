"use client";

import { useState } from "react";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { localeNames, localeFlags, routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthProvider } from "@/lib/auth-context";
import { GeoProvider } from "@/lib/use-geo";
import { CurrencyProvider } from "@/lib/use-currency";
import { CurrencySelector } from "@/components/currency-selector";
import { NotificationBell } from "@/components/notification-bell";
import { RoleMark, getRoleLabel } from "@/components/ui/role-mark";
import { BrandLogo } from "@/components/brand-logo";
import { PublicSiteShell } from "@/components/public-site-shell";
import { PUBLIC_INFO_PAGE_SLUGS } from "@/lib/public-page-content";
import {
  Bell,
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  User2,
} from "lucide-react";

const PUBLIC_PATHS = new Set([
  "/about",
  "/contact",
  ...PUBLIC_INFO_PAGE_SLUGS.map((slug) => `/${slug}`),
]);

function isPublicPath(pathname: string) {
  const normalizedPath = pathname === "/" ? pathname : pathname.replace(/\/$/, "");
  return PUBLIC_PATHS.has(normalizedPath);
}

function NavBar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRtl = locale === "ar";

  const switchLocale = (newLocale: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("manual_locale", "true");
    }
    router.replace(pathname, { locale: newLocale });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isSeller = user?.role === "FARMER" || user?.role === "AGGREGATOR";
  const sellerKycApproved = isSeller && user?.kycStatus === "APPROVED";

  const navLinks = [
    { href: "/marketplace", label: t("marketplace") },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    ...(user ? [{ href: "/dashboard", label: t("dashboard") }] : []),
    // Seller links — only visible when KYC is approved
    ...(sellerKycApproved
      ? [{ href: "/dashboard/my-submissions", label: t("mySubmissions") }]
      : []),
    ...(sellerKycApproved
      ? [{ href: "/dashboard/my-lots", label: t("myLots") }]
      : []),
    ...(user?.role === "BUYER"
      ? [
          { href: "/dashboard/watchlist", label: <><Heart className="w-4 h-4 inline" /> {t("watchlist")}</> },
          { href: "/dashboard/my-rfqs", label: t("myRfqs") },
        ]
      : []),
    ...(sellerKycApproved
      ? [{ href: "/rfq/browse", label: t("browseRfqs") }]
      : []),
    ...(user?.role === "BUYER"
      ? [{ href: "/dashboard/my-tokens", label: t("myTokens") }]
      : []),
    ...(user?.role === "BUYER" || sellerKycApproved
      ? [{ href: "/dashboard/transactions", label: t("transactions") }]
      : []),
  ];

  const isActive = (href: string) => pathname.endsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9d1c2] bg-[#fffdf8]/92 backdrop-blur-md">
      <div className="mx-auto max-w-370 px-4 sm:px-6 xl:px-10">
        <div className={`flex items-center justify-between h-16 ${isRtl ? "flex-row-reverse" : ""}`}>
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2" aria-label="Krishibridge">
            <BrandLogo size={32} priority />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-sage-50 text-sage-600 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  isActive(link.href)
                    ? "border-[#405742] bg-[#eef3e8] text-[#223120]"
                    : "border-[#ddd4c4] bg-white text-stone-600 hover:border-[#b9ad95] hover:bg-[#faf6ee] hover:text-stone-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Notification Bell + Currency Selector + Language Switcher + User menu */}
          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <NotificationBell />
            <CurrencySelector />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 items-center gap-1.5 border border-[#ddd4c4] bg-white px-3 text-sm outline-none transition-colors hover:bg-[#faf6ee]">
                <span>{localeFlags[locale]}</span>
                <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 sm:inline">
                  {locale.toUpperCase()}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48 p-1.5">
                {routing.locales.map((loc) => (
                  <DropdownMenuItem
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={loc === locale ? "bg-[#f3ede0] font-semibold text-stone-900" : ""}
                  >
                    <span className="mr-2">{localeFlags[loc]}</span>
                    {localeNames[loc]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isLoading ? (
              <div className="h-10 w-10 animate-pulse border border-[#ddd4c4] bg-[#f3ede0]" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-11 items-center gap-2 border border-[#ddd4c4] bg-white px-2.5 outline-none transition-colors hover:bg-[#faf6ee]">
                  <RoleMark role={user.role} size="sm" />
                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="truncate text-sm font-semibold text-stone-900">{user.name.split(" ")[0]}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-72 p-0">
                  <div className="border-b border-[#e4dccf] bg-[#faf6ee] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <RoleMark role={user.role} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-950">{user.name}</p>
                        <p className="truncate text-xs text-stone-600">{user.email}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b6d4d]">
                          {getRoleLabel(user.role)} account
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-1.5">
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard className="w-4 h-4" /> {t("dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User2 className="w-4 h-4" /> {t("profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/kyc")}>
                      <ShieldCheck className="w-4 h-4" /> {t("kycDocuments")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/region-settings")}>
                      <Globe className="w-4 h-4" /> {t("regionSettings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/notification-preferences")}>
                      <Bell className="w-4 h-4" /> {t("notificationPrefs")}
                    </DropdownMenuItem>
                    {user.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/admin")}>
                          <SlidersHorizontal className="w-4 h-4" /> {t("adminPanel")}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" /> {t("logout")}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="border border-[#ddd4c4] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 transition-colors hover:bg-[#faf6ee] hover:text-stone-900"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="border border-[#405742] bg-[#223120] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2d4630]"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#e4dccf] bg-white md:hidden">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  isActive(link.href)
                    ? "border-[#405742] bg-[#eef3e8] text-[#223120]"
                    : "border-[#ddd4c4] bg-white text-stone-600 hover:bg-[#faf6ee] hover:text-stone-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block border border-[#ddd4c4] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 hover:bg-[#faf6ee] hover:text-stone-900"
                >
                  {t("profile")}
                </Link>
                <Link
                  href="/kyc"
                  onClick={() => setMobileOpen(false)}
                  className="block border border-[#ddd4c4] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 hover:bg-[#faf6ee] hover:text-stone-900"
                >
                  {t("kycDocuments")}
                </Link>
                <Link
                  href="/dashboard/region-settings"
                  onClick={() => setMobileOpen(false)}
                  className="block border border-[#ddd4c4] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 hover:bg-[#faf6ee] hover:text-stone-900"
                >
                  <Globe className="w-4 h-4 inline" /> {t("regionSettings")}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block border border-[#d7c2bd] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta hover:bg-terracotta/5"
                  >
                    {t("adminPanel")}
                  </Link>
                )}
              </>
            )}
            {!isLoading && !user && (
              <div className="grid grid-cols-2 gap-2 pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block border border-[#ddd4c4] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600 hover:bg-[#faf6ee] hover:text-stone-900"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block border border-[#405742] bg-[#223120] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#2d4630]"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const publicPage = isPublicPath(pathname);

  return (
    <AuthProvider>
      <GeoProvider>
        <CurrencyProvider>
          {publicPage ? (
            <PublicSiteShell>{children}</PublicSiteShell>
          ) : (
            <div className="min-h-screen bg-[#f5f1e8]">
              <NavBar />
              <main className="mx-auto max-w-370 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
                {children}
              </main>
            </div>
          )}
        </CurrencyProvider>
      </GeoProvider>
    </AuthProvider>
  );
}
