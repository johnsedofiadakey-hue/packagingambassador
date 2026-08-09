"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, MoreHorizontal } from "lucide-react";

type Icon = React.ComponentType<{ className?: string }>;
export type DockItem = { href: string; label: string; short: string; icon: Icon };

/**
 * Native-app-style bottom navigation for the staff console (mobile only). Shows the staff's
 * first few permitted sections as thumb-reachable tabs, with a "More" sheet for the rest plus
 * View Storefront / Log Out. Desktop uses the sidebar instead.
 */
export function AdminBottomDock({
  nav,
  onSignOut,
  staffName,
  staffRole,
}: {
  nav: DockItem[];
  onSignOut: () => void;
  staffName: string;
  staffRole: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = nav.slice(0, 3);

  const isActive = (href: string) =>
    href === "/admin/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-ink-900/15" />
            <div className="grid grid-cols-3 gap-3">
              {nav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-colors ${
                      active ? "bg-amber-500/15 text-amber-700" : "bg-sand-100 text-ink-800"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 space-y-1 border-t border-ink-900/8 pt-3">
              <Link
                href="/"
                target="_blank"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-800 hover:bg-ink-900/5"
              >
                <ExternalLink className="h-4 w-4" /> View Storefront
              </Link>
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </button>
              <p className="px-3 pt-1 text-xs text-ink-700/50">
                {staffName} · {staffRole}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-white/50 bg-white/90 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
            >
              <item.icon className={`h-6 w-6 ${active ? "text-amber-600" : "text-ink-700/55"}`} />
              <span className={`text-[10px] font-semibold ${active ? "text-amber-600" : "text-ink-700/70"}`}>
                {item.short}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
        >
          <MoreHorizontal className="h-6 w-6 text-ink-700/55" />
          <span className="text-[10px] font-semibold text-ink-700/70">More</span>
        </button>
      </nav>
    </>
  );
}
