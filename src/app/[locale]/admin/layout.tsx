"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import {
  LayoutDashboard, Users, ClipboardCheck, Sprout, Warehouse,
  Package, CreditCard, FileText, Scale, Landmark, TrendingUp,
  Link2, ArrowLeft, Menu, X, LogOut, UserPlus,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

type NavGroup = "oversight" | "operations" | "platform";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, permission: "dashboard.view", group: "oversight" as NavGroup },
  { href: "/admin/users", label: "Users & KYC", Icon: Users, permission: "users.view", group: "oversight" as NavGroup },
  { href: "/admin/kyc", label: "KYC Approvals", Icon: ClipboardCheck, permission: "kyc.view", group: "oversight" as NavGroup },
  { href: "/admin/transactions", label: "Transactions", Icon: CreditCard, permission: "transactions.view", group: "oversight" as NavGroup },
  { href: "/admin/commodity-submissions", label: "Submissions", Icon: Sprout, permission: "lots.approve", group: "operations" as NavGroup },
  { href: "/admin/warehouses", label: "Warehouses", Icon: Warehouse, permission: "warehouses.view", group: "operations" as NavGroup },
  { href: "/admin/lots", label: "Lots", Icon: Package, permission: "lots.view", group: "operations" as NavGroup },
  { href: "/admin/rfqs", label: "RFQs", Icon: FileText, permission: "rfq.view", group: "operations" as NavGroup },
  { href: "/admin/disputes", label: "Disputes", Icon: Scale, permission: "transactions.view", group: "operations" as NavGroup },
  { href: "/admin/platform-settings", label: "Platform Settings", Icon: Landmark, permission: "escrow.release", group: "platform" as NavGroup },
  { href: "/admin/team", label: "Admin Team", Icon: UserPlus, permission: "super_admin_only", group: "platform" as NavGroup },
  { href: "/admin/analytics", label: "Analytics", Icon: TrendingUp, permission: "analytics.view", group: "platform" as NavGroup },
  { href: "/admin/integration", label: "Integration", Icon: Link2, permission: null, group: "platform" as NavGroup },
] as const;

const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  oversight: "Oversight",
  operations: "Operations",
  platform: "Platform",
};

const NAV_GROUP_ORDER: NavGroup[] = ["oversight", "operations", "platform"];

const ADMIN_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  COMPLIANCE_ADMIN: ["dashboard.view", "users.view", "users.manage", "kyc.view", "kyc.approve", "lots.view", "lots.approve", "audit.view", "analytics.view"],
  OPS_ADMIN: ["dashboard.view", "lots.view", "lots.approve", "rfq.view", "rfq.route", "rfq.set_terms", "escrow.release", "transactions.view", "analytics.view", "warehouses.view", "warehouses.manage"],
  DATA_AUDIT_ADMIN: ["dashboard.view", "audit.view", "analytics.view", "transactions.view", "users.view", "lots.view", "rfq.view", "kyc.view", "warehouses.view"],
  READ_ONLY_ADMIN: ["dashboard.view", "users.view", "kyc.view", "lots.view", "rfq.view", "transactions.view", "analytics.view", "audit.view", "warehouses.view"],
};

function hasPermission(adminRole: string | null | undefined, permission: string | null): boolean {
  if (!permission) return true; // null permission = visible to all admins
  if (!adminRole) return false;
  if (permission === "super_admin_only") return adminRole === "SUPER_ADMIN";
  const perms = ADMIN_PERMISSIONS[adminRole];
  if (!perms) return false;
  return perms.includes("*") || perms.includes(permission);
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPLIANCE_ADMIN: "Compliance Admin",
  OPS_ADMIN: "Operations Admin",
  DATA_AUDIT_ADMIN: "Data & Audit Admin",
  READ_ONLY_ADMIN: "Read-Only Admin",
};

function AdminSidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname.endsWith("/admin");
    return pathname.includes(href);
  };

  const visibleNav = ADMIN_NAV.filter((item) => hasPermission(user?.adminRole, item.permission));
  const groupedNav = NAV_GROUP_ORDER.map((group) => ({
    group,
    items: visibleNav.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);

  const sidebarContent = (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#d7cebe] bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(247,241,231,0.98))] text-stone-900 lg:sticky lg:top-0">
      <div className="border-b border-[#ddd4c4] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2" onClick={onClose} aria-label="Krishibridge admin">
            <div className="bg-white border border-[#ddd4c4] rounded-lg p-1.5">
              <BrandLogo size={26} priority />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d4d]">Admin</span>
          </Link>
          {onClose ? (
            <button
              onClick={onClose}
              className="lg:hidden border border-[#ddd4c4] bg-white p-2 text-stone-600 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950"
              aria-label="Close admin navigation"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groupedNav.map((section) => (
          <div key={section.group} className="space-y-1">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b6d4d]">
              {NAV_GROUP_LABELS[section.group]}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-[#405742] bg-[#405742] text-white"
                        : "border-transparent text-stone-700 hover:bg-[#fcfaf4] hover:text-stone-950"
                    )}
                  >
                    <item.Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-[#6b6253]")} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#ddd4c4] p-3 space-y-2">
        <div className="rounded-md border border-[#ddd4c4] bg-white px-3 py-2">
          <p className="truncate text-xs font-semibold text-stone-900">{user?.name || "Admin user"}</p>
          <p className="truncate text-[11px] text-stone-500">
            {ROLE_LABELS[user?.adminRole || ""] || "Administrator"}
          </p>
        </div>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#ddd4c4] bg-white px-3 text-xs font-medium text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to main app
        </Link>
      </div>
    </aside>
  );

  // Mobile: overlay drawer
  if (mobileOpen !== undefined) {
    return (
      <>
        {/* Desktop sidebar */}
        <div className="hidden lg:block">{sidebarContent}</div>
        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 max-w-[86vw]">{sidebarContent}</div>
          </div>
        )}
      </>
    );
  }

  return sidebarContent;
}

function AdminHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const currentSection = ADMIN_NAV.find((item) => {
    if (item.href === "/admin") return pathname.endsWith("/admin");
    return pathname.includes(item.href);
  });
  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#ddd4c4] bg-[#fffdf8]/92 backdrop-blur-md shrink-0">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="border border-[#ddd4c4] bg-white p-2 text-stone-700 transition-colors hover:bg-[#f8f4ec] hover:text-stone-950 lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-stone-950">
              {currentSection?.label || "Overview"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 border border-[#ddd4c4] bg-white/86 px-3 py-2 md:flex">
            <div className="grid h-10 w-10 place-items-center border border-[#ddd4c4] bg-[#f8f4ec] text-sm font-semibold text-[#405742]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">{user?.name}</p>
              <p className="truncate text-xs text-stone-500">
                {ROLE_LABELS[user?.adminRole || ""] || "Administrator"}
              </p>
            </div>
          </div>
          <div className="border border-[#ddd4c4] bg-white/86 p-2">
            <NotificationBell />
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-10 items-center gap-2 border border-[#405742] bg-[#405742] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#f5efe3,#ede4d4)] px-6">
        <div className="console-note px-5 py-4 text-sm text-stone-600">Loading admin workspace...</div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#f5efe3,#ede4d4)] px-6">
        <div className="console-note max-w-md px-6 py-6 text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-stone-950 mb-2">Access denied</h1>
          <p className="mb-4 text-sm text-stone-600">You do not have admin privileges for this workspace.</p>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2f422e]"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthProvider>
      <AdminGuard>
        <div className="admin-console min-h-screen bg-[radial-gradient(circle_at_top,rgba(241,212,135,0.18),transparent_34%),linear-gradient(180deg,#f5efe3,#ede5d7)] text-stone-900">
          <div className="relative flex min-h-screen">
            <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
              <AdminHeader onMenuToggle={() => setMobileOpen(true)} />
              <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1600px]">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
