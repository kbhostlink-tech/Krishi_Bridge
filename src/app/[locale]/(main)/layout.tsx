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

function NavBar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/marketplace", label: t("marketplace") },
    ...(user?.role === "FARMER" ? [{ href: "/dashboard/my-lots", label: "My Lots" }] : []),
    ...(user?.role === "BUYER" ? [{ href: "/dashboard/watchlist", label: "♥ Watchlist" }] : []),
    ...(user?.role === "WAREHOUSE_STAFF" || user?.role === "ADMIN"
      ? [
          { href: "/warehouse/intake", label: "Intake" },
          { href: "/warehouse/inventory", label: "Inventory" },
        ]
      : []),
  ];

  const isActive = (href: string) => pathname.endsWith(href);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-sage-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading text-sage-700 text-xl font-bold">
              AgriExchange
            </span>
          </Link>

          {/* Navigation */}
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
          <nav className="hidden md:flex items-center gap-1">
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

          {/* Language Switcher + User menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full h-9 px-3 flex items-center gap-1.5 hover:bg-sage-50 outline-none cursor-pointer text-sm">
                <span>{localeFlags[locale]}</span>
                <span className="hidden sm:inline text-sage-600 text-xs font-medium">
                  {locale.toUpperCase()}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
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
                <DropdownMenuContent align="end" className="w-56">
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
                    KYC Documents
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        🔧 Admin Panel
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
                  KYC Documents
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-terracotta hover:bg-terracotta/5"
                  >
                    Admin Panel
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
      <div className="min-h-screen bg-linen">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
