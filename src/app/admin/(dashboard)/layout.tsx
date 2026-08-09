"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  ExternalLink,
  Newspaper,
  History,
  Building2,
  BarChart3,
  Monitor,
  Receipt,
  Boxes,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { auth } from "@/lib/firebase";
import { useCurrentStaff } from "@/lib/useCurrentStaff";
import { hasPermission, staffHome, type PermissionKey } from "@/lib/permissions";
import { AdminBottomDock, type DockItem } from "@/components/admin/AdminBottomDock";

type Perm = PermissionKey | "dashboard" | "staff" | "settings" | "activity";
type NavItem = DockItem & { perm: Perm };

// Order matters: the first permitted three become the mobile dock tabs, so keep the most-used
// (Home, Sell, Orders) at the top. `perm` drives both what's shown and the per-page guard.
const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard, perm: "dashboard" },
  { href: "/admin/pos", label: "Point of Sale", short: "Sell", icon: Monitor, perm: "pos" },
  { href: "/admin/orders", label: "Orders", short: "Orders", icon: ShoppingBag, perm: "orders" },
  { href: "/admin/products", label: "Products", short: "Products", icon: Package, perm: "products" },
  { href: "/admin/inventory", label: "Inventory", short: "Stock", icon: Boxes, perm: "inventory" },
  { href: "/admin/sales", label: "Sales Records", short: "Sales", icon: Receipt, perm: "sales" },
  { href: "/admin/business-customers", label: "Business Customers", short: "Clients", icon: Building2, perm: "customers" },
  { href: "/admin/categories", label: "Categories", short: "Categories", icon: FolderTree, perm: "categories" },
  { href: "/admin/analytics", label: "Analytics", short: "Analytics", icon: BarChart3, perm: "analytics" },
  { href: "/admin/reconciliation", label: "Reconciliation", short: "Reconcile", icon: ShieldCheck, perm: "reconciliation" },
  { href: "/admin/blog", label: "Blog", short: "Blog", icon: Newspaper, perm: "blog" },
  { href: "/admin/staff", label: "Staff", short: "Staff", icon: Users, perm: "staff" },
  { href: "/admin/activity", label: "Activity Log", short: "Activity", icon: History, perm: "activity" },
  { href: "/admin/settings", label: "Settings", short: "Settings", icon: Settings, perm: "settings" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, staffDoc, loading } = useCurrentStaff();
  const authorized = Boolean(user && staffDoc?.active);

  useEffect(() => {
    if (!loading && !authorized) router.replace("/admin/login");
  }, [loading, authorized, router]);

  // Per-page guard: match the path to its nav item (longest href prefix so sub-routes resolve)
  // and bounce to the staff's home if they lack that page's permission.
  useEffect(() => {
    if (loading || !staffDoc) return;
    const match = NAV.filter(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    ).sort((a, b) => b.href.length - a.href.length)[0];
    if (match && !hasPermission(staffDoc, match.perm)) {
      router.replace(staffHome(staffDoc));
    }
  }, [pathname, loading, staffDoc, router]);

  if (loading || !authorized || !staffDoc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-100">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-forest-600 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500" />
        </div>
      </div>
    );
  }

  const visibleNav = NAV.filter((item) => hasPermission(staffDoc, item.perm));

  return (
    <div className="flex min-h-screen bg-sand-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/40 bg-white/60 shadow-sm shadow-ink-900/5 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <Logo className="h-9" />
          <span className="font-display leading-tight">
            <span className="block text-sm font-bold text-ink-900">Packaging</span>
            <span className="block text-[10px] font-bold tracking-widest text-amber-600">STAFF CONSOLE</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-amber-500/10 hover:text-amber-700"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-ink-900/8 px-3 py-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/5"
          >
            <ExternalLink className="h-4 w-4" />
            View Storefront
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          <p className="px-3 pt-1 text-xs text-ink-700/50">
            {staffDoc.name} · {staffDoc.role}
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile app header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/50 bg-white/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <Logo className="h-7" />
            <span className="font-display text-sm font-bold text-ink-900">Staff Console</span>
          </div>
          <span className="rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-medium text-ink-700/70">
            {staffDoc.name}
          </span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">{children}</main>
      </div>

      <AdminBottomDock
        nav={visibleNav}
        onSignOut={() => signOut(auth)}
        staffName={staffDoc.name}
        staffRole={staffDoc.role}
      />
    </div>
  );
}
