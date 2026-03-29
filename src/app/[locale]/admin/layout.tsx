"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "📊", ready: true },
  { href: "/admin/users", label: "Users & KYC", icon: "👥", ready: true },
  { href: "/admin/kyc", label: "KYC Approvals", icon: "📋", ready: true },
  { href: "/admin/warehouses", label: "Warehouses", icon: "🏪", ready: true },
  { href: "/admin/lots", label: "Lots", icon: "📦", ready: true },
  { href: "/admin/transactions", label: "Transactions", icon: "💳", ready: false },
  { href: "/admin/rfqs", label: "RFQs", icon: "📝", ready: false },
  { href: "/admin/analytics", label: "Analytics", icon: "📈", ready: false },
];

function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname.endsWith("/admin");
    return pathname.includes(href);
  };

  return (
    <aside className="w-64 min-h-screen bg-sage-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sage-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sage-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-heading font-bold text-xs">A</span>
          </div>
          <div>
            <span className="font-heading text-white text-base font-bold block leading-tight">
              AgriExchange
            </span>
            <span className="text-sage-400 text-[10px] uppercase tracking-widest">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {ADMIN_NAV.map((item) =>
          item.ready ? (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive(item.href)
                  ? "bg-sage-700 text-white"
                  : "text-sage-300 hover:bg-sage-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <span
              key={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sage-600 cursor-not-allowed"
              title="Coming in Week 2+"
            >
              <span className="text-base opacity-50">{item.icon}</span>
              <span className="opacity-50">{item.label}</span>
              <span className="ml-auto text-[9px] bg-sage-800 text-sage-400 px-1.5 py-0.5 rounded-full">Soon</span>
            </span>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sage-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sage-400 hover:text-white text-xs transition-colors"
        >
          ← Back to Main App
        </Link>
      </div>
    </aside>
  );
}

function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b border-sage-100 flex items-center justify-between px-6 shrink-0">
      <h2 className="font-heading text-sage-900 text-sm font-semibold">Administration</h2>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sage-500 text-xs">
            {user.name} ({user.role})
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-sage-500 hover:text-sage-700 transition-colors"
        >
          Logout
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
  return (
    <AuthProvider>
      <AdminGuard>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader />
            <main className="flex-1 bg-linen p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
