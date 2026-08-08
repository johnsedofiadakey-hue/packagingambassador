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
import type { StaffRole } from "@/lib/store";

const ALL_ROLES: StaffRole[] = ["Admin", "Sales Staff", "Inventory Staff"];

// `roles` is the source of truth for BOTH the sidebar (hide links) and the per-page
// guard below (redirect on direct-URL access). Admin sees everything; the two staff
// roles get real, distinct scopes — Sales handles selling, Inventory handles stock.
const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["Admin"] as StaffRole[] },
  { href: "/admin/pos", label: "Point of Sale", icon: Monitor, roles: ["Admin", "Sales Staff"] as StaffRole[] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, roles: ALL_ROLES },
  { href: "/admin/sales", label: "Sales Records", icon: Receipt, roles: ["Admin", "Sales Staff"] as StaffRole[] },
  { href: "/admin/reconciliation", label: "Reconciliation", icon: ShieldCheck, roles: ["Admin"] as StaffRole[] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ALL_ROLES },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ["Admin", "Inventory Staff"] as StaffRole[] },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, roles: ["Admin", "Inventory Staff"] as StaffRole[] },
  { href: "/admin/business-customers", label: "Business Customers", icon: Building2, roles: ["Admin", "Sales Staff"] as StaffRole[] },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, roles: ["Admin"] as StaffRole[] },
  { href: "/admin/staff", label: "Staff", icon: Users, roles: ["Admin"] as StaffRole[] },
  { href: "/admin/activity", label: "Activity Log", icon: History, roles: ["Admin"] as StaffRole[] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["Admin"] as StaffRole[] },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, staffDoc, loading } = useCurrentStaff();
  const authorized = Boolean(user && staffDoc?.active);

  useEffect(() => {
    if (!loading && !authorized) router.replace("/admin/login");
  }, [loading, authorized, router]);

  // Per-page role guard: hiding a nav link isn't access control — a staff member could
  // type an admin-only URL directly. Match the current path to its nav item (longest
  // href prefix, so sub-routes like /admin/pos/receipt/x resolve to /admin/pos) and
  // bounce to the dashboard (which every role can see) if the role isn't permitted.
  useEffect(() => {
    if (loading || !staffDoc) return;
    const match = NAV.filter(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    ).sort((a, b) => b.href.length - a.href.length)[0];
    if (match && !match.roles.includes(staffDoc.role)) {
      router.replace("/admin/dashboard");
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

  const visibleNav = NAV.filter((item) => item.roles.includes(staffDoc.role));

  return (
    <div className="flex min-h-screen bg-sand-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/40 bg-white/60 shadow-sm shadow-ink-900/5 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <Logo className="h-9" />
          <span className="font-display leading-tight">
            <span className="block text-sm font-bold text-ink-900">Packaging</span>
            <span className="block text-[10px] font-bold tracking-widest text-amber-600">
              ADMIN PORTAL
            </span>
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
        <div className="flex gap-1 overflow-x-auto border-b border-white/40 bg-white/60 px-3 py-2 backdrop-blur-xl md:hidden">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink-800 hover:bg-amber-500/10 hover:text-amber-700"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
