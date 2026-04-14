"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { useLocale } from "next-intl";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import {
  LayoutDashboard, Users, ClipboardCheck, Sprout, Warehouse,
  Package, CreditCard, FileText, Scale, Landmark, TrendingUp,
  Link2, ArrowLeft, Menu, X, LogOut,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/admin/users", label: "Users & KYC", Icon: Users, permission: "users.view" },
  { href: "/admin/kyc", label: "KYC Approvals", Icon: ClipboardCheck, permission: "kyc.view" },
  { href: "/admin/commodity-submissions", label: "Submissions", Icon: Sprout, permission: "lots.approve" },
  { href: "/admin/warehouses", label: "Warehouses", Icon: Warehouse, permission: "warehouses.view" },
  { href: "/admin/lots", label: "Lots", Icon: Package, permission: "lots.view" },
  { href: "/admin/transactions", label: "Transactions", Icon: CreditCard, permission: "transactions.view" },
  { href: "/admin/rfqs", label: "RFQs", Icon: FileText, permission: "rfq.view" },
  { href: "/admin/disputes", label: "Disputes", Icon: Scale, permission: "transactions.view" },
  { href: "/admin/platform-settings", label: "Platform Settings", Icon: Landmark, permission: "escrow.release" },
  { href: "/admin/analytics", label: "Analytics", Icon: TrendingUp, permission: "analytics.view" },
  { href: "/admin/integration", label: "Integration", Icon: Link2, permission: null },
];

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
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname.endsWith("/admin");
    return pathname.includes(href);
  };

  const visibleNav = ADMIN_NAV.filter((item) => hasPermission(user?.adminRole, item.permission));

  const sidebarContent = (
    <aside className={`w-64 min-h-screen bg-sage-900 text-white flex flex-col shrink-0 ${isRtl ? "border-l border-sage-800" : "border-r border-sage-800"}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sage-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 bg-sage-700 rounded-lg flex items-center justify-center overflow-hidden">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#2d5a3f" />
              <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
              <path d="M15 14 L18 20 L12 20 Z" fill="white" />
            </svg>
          </div>
          <div>
            <span className="font-heading text-white text-base font-bold block leading-tight">
              HCE-X
            </span>
            <span className="text-sage-400 text-[10px] uppercase tracking-widest">
              Admin Panel
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-sage-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              isActive(item.href)
                ? "bg-sage-700 text-white"
                : "text-sage-300 hover:bg-sage-800 hover:text-white"
            }`}
          >
            <item.Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sage-800">
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`flex items-center gap-2 text-sage-400 hover:text-white text-xs transition-colors ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isRtl ? "العودة للتطبيق" : "Back to Main App"}
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
            <div className="relative z-10">{sidebarContent}</div>
          </div>
        )}
      </>
    );
  }

  return sidebarContent;
}

function AdminHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b border-sage-100 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-sage-600 hover:text-sage-900">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-heading text-sage-900 text-sm font-semibold hidden sm:block">Administration</h2>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sage-500 text-xs hidden sm:inline">
            {user.name}
            {user.adminRole && (
              <span className="ml-1 text-sage-400">
                ({ROLE_LABELS[user.adminRole] || user.adminRole})
              </span>
            )}
          </span>
        )}
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="text-xs text-sage-500 hover:text-sage-700 transition-colors flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linen">
        <div className="text-sage-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linen">
        <div className="text-center">
          <h1 className="font-heading text-sage-900 text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-sage-500 mb-4 text-sm">You do not have admin privileges.</p>
          <Link
            href="/dashboard"
            className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
          >
            Go to Dashboard
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
        <div className="flex min-h-screen">
          <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader onMenuToggle={() => setMobileOpen(true)} />
            <main className="flex-1 bg-linen p-4 sm:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
