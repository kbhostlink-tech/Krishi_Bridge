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
import { Heart, Globe } from "lucide-react";

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
    { href: "/dashboard", label: t("dashboard") },
    { href: "/marketplace", label: t("marketplace") },
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
    ...(user?.role === "BUYER" || sellerKycApproved
      ? [{ href: "/dashboard/my-tokens", label: t("myTokens") }]
      : []),
  ];

  const isActive = (href: string) => pathname.endsWith(href);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-sage-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${isRtl ? "flex-row-reverse" : ""}`}>
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#2d5a3f" />
              <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
              <path d="M15 14 L18 20 L12 20 Z" fill="white" />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sage-900 text-sm font-bold leading-none">HCE-X</span>
              <span className="text-sage-500 text-[8px] leading-tight tracking-wide hidden sm:block">Himalayan Commodity Exchange</span>
            </div>
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
          <nav className={`hidden md:flex items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-sage-50 text-sage-700"
                    : "text-sage-500 hover:text-sage-700 hover:bg-sage-50/50"
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
              <DropdownMenuTrigger className="rounded-full h-9 px-3 flex items-center gap-1.5 hover:bg-sage-50 outline-none cursor-pointer text-sm">
                <span>{localeFlags[locale]}</span>
                <span className="hidden sm:inline text-sage-600 text-xs font-medium">
                  {locale.toUpperCase()}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-44">
                {routing.locales.map((loc) => (
                  <DropdownMenuItem
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={loc === locale ? "bg-sage-50 font-medium" : ""}
                  >
                    <span className="mr-2">{localeFlags[loc]}</span>
                    {localeNames[loc]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {!isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full h-10 px-3 flex items-center gap-2 hover:bg-sage-50 outline-none cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm text-sage-700 font-medium">
                    {user.name.split(" ")[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-sage-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-sage-500">{user.email}</p>
                    <span className="inline-block mt-1 text-xs bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    {t("profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/kyc")}>
                    {t("kycDocuments")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/region-settings")}>
                    <Globe className="w-4 h-4" /> {t("regionSettings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/notification-preferences")}>
                    🔔 {t("notificationPrefs")}
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        🔧 {t("adminPanel")}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="w-8 h-8 rounded-full bg-sage-100 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-sage-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-sage-50 text-sage-700"
                    : "text-sage-500 hover:text-sage-700 hover:bg-sage-50/50"
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
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sage-500 hover:text-sage-700 hover:bg-sage-50/50"
                >
                  {t("profile")}
                </Link>
                <Link
                  href="/kyc"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sage-500 hover:text-sage-700 hover:bg-sage-50/50"
                >
                  {t("kycDocuments")}
                </Link>
                <Link
                  href="/dashboard/region-settings"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sage-500 hover:text-sage-700 hover:bg-sage-50/50"
                >
                  <Globe className="w-4 h-4 inline" /> {t("regionSettings")}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-terracotta hover:bg-terracotta/5"
                  >
                    {t("adminPanel")}
                  </Link>
                )}
              </>
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
  return (
    <AuthProvider>
      <GeoProvider>
        <CurrencyProvider>
        <div className="min-h-screen bg-linen">
          <NavBar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
        </CurrencyProvider>
      </GeoProvider>
    </AuthProvider>
  );
}
