"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatPrice, cn } from "@/lib/utils";

type Unmatched = {
  reference: string;
  amount: number;
  paidAt: string | null;
  channel: "retail" | "wholesale";
  customerName: string;
  reconstructable: boolean;
};

export default function ReconciliationPage() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<number | null>(null);
  const [unmatched, setUnmatched] = useState<Unmatched[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [fixed, setFixed] = useState<Record<string, string>>({});

  const authedFetch = async (body: unknown) => {
    const token = await auth.currentUser?.getIdToken();
    return fetch("/api/admin/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  };

  const runScan = async () => {
    setScanning(true);
    setError(null);
    setFixed({});
    try {
      const res = await authedFetch({ action: "scan", perPage: 100 });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reconciliation failed.");
      } else {
        setScanned(data.scanned);
        setUnmatched(data.unmatched);
      }
    } catch {
      setError("Reconciliation failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const reconstruct = async (reference: string) => {
    setBusyRef(reference);
    setError(null);
    try {
      const res = await authedFetch({ action: "reconstruct", reference });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't rebuild that order.");
      } else {
        setFixed((f) => ({ ...f, [reference]: data.orderId }));
      }
    } catch {
      setError("Couldn't rebuild that order. Please try again.");
    } finally {
      setBusyRef(null);
    }
  };

  const outstanding = unmatched.filter((u) => !fixed[u.reference]);

  return (
    <div>
      <AdminPageHeader
        title="Payment Reconciliation"
        description="Cross-check Paystack's successful charges against your orders. Anything paid without a matching order is surfaced here — and rebuilt on the spot when the charge still carries the cart."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", scanning && "animate-spin")} />
          {scanning ? "Scanning…" : "Run reconciliation"}
        </button>
        {scanned !== null && !scanning && (
          <span className="text-sm text-ink-700/60">
            Checked the {scanned} most recent successful charge{scanned === 1 ? "" : "s"}.
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {scanned !== null && outstanding.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-forest-600/20 bg-forest-600/5 px-5 py-6 text-forest-800">
          <ShieldCheck className="h-6 w-6" />
          <div>
            <p className="font-display font-semibold">Everything reconciles.</p>
            <p className="text-sm text-forest-800/70">
              Every recent Paystack charge has a matching order.
            </p>
          </div>
        </div>
      )}

      {outstanding.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/60">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {outstanding.map((u) => (
                <tr key={u.reference}>
                  <td className="px-5 py-3 font-mono text-xs text-ink-900">{u.reference}</td>
                  <td className="px-5 py-3 capitalize text-ink-700/80">{u.channel}</td>
                  <td className="px-5 py-3 text-ink-700/80">{u.customerName}</td>
                  <td className="px-5 py-3 font-semibold text-ink-900">{formatPrice(u.amount)}</td>
                  <td className="px-5 py-3 text-ink-700/60">
                    {u.paidAt ? new Date(u.paidAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.reconstructable ? (
                      <button
                        onClick={() => reconstruct(u.reference)}
                        disabled={busyRef === u.reference}
                        className="rounded-full bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
                      >
                        {busyRef === u.reference ? "Rebuilding…" : "Rebuild order"}
                      </button>
                    ) : (
                      <span className="text-xs text-ink-700/50">Reconcile manually</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(fixed).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(fixed).map(([ref, orderId]) => (
            <p key={ref} className="flex items-center gap-2 text-sm text-forest-700">
              <CheckCircle2 className="h-4 w-4" />
              Rebuilt <span className="font-mono text-xs">{ref}</span> → order{" "}
              <span className="font-semibold">{orderId}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
