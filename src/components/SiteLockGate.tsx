"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAdminData } from "@/lib/store";
import { useCurrentStaff } from "@/lib/useCurrentStaff";

/**
 * Sitewide lockdown. A single gate in the storefront layout — the blueprint's
 * "one early-return, not per-route checks" pattern — so the whole public site can
 * be closed at once (maintenance, sold-out event, off-hours) without touching any
 * page. Active staff bypass it so they can keep working and preview the live site;
 * /admin/login lives outside this layout, so staff can always sign in.
 */
export function SiteLockGate({ children }: { children: React.ReactNode }) {
  const { settings } = useAdminData();
  const { staffDoc } = useCurrentStaff();
  const isStaff = staffDoc?.active === true;

  if (!settings.siteLocked || isStaff) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-sand-200 px-6 text-center">
      <div className="glass w-full max-w-md rounded-3xl p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-ink-900">
          {settings.storeName}
        </h1>
        <p className="mt-3 text-ink-700/80">{settings.siteLockMessage}</p>
        {(settings.storePhone || settings.storeEmail) && (
          <p className="mt-6 text-sm text-ink-700/60">
            Need us now?{" "}
            {settings.storeEmail && (
              <a href={`mailto:${settings.storeEmail}`} className="font-semibold text-amber-600 hover:underline">
                {settings.storeEmail}
              </a>
            )}
            {settings.storePhone && settings.storeEmail && " · "}
            {settings.storePhone && <span className="font-semibold text-ink-800">{settings.storePhone}</span>}
          </p>
        )}
      </div>
      <Link href="/admin/login" className="mt-6 text-xs font-medium text-ink-700/40 hover:text-ink-700/70">
        Staff login
      </Link>
    </div>
  );
}
