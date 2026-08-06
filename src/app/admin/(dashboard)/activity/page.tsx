"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { collection, onSnapshot, orderBy, query, limit, type Timestamp } from "firebase/firestore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { db } from "@/lib/firebase";

type ActivityEntry = {
  id: string;
  uid: string;
  name: string;
  role: string | null;
  action: string;
  details: Record<string, unknown> | null;
  timestamp: Timestamp | null;
};

const ACTION_LABELS: Record<string, string> = {
  product_added: "Product added",
  product_updated: "Product updated",
  product_removed: "Product removed",
  order_status_changed: "Order status changed",
  staff_added: "Staff added",
  staff_updated: "Staff updated",
  staff_removed: "Staff removed",
  settings_changed: "Settings changed",
};

function describeEntry(entry: ActivityEntry): string {
  const d = entry.details ?? {};
  switch (entry.action) {
    case "product_added":
      return `${d.name ?? d.slug ?? "—"}`;
    case "product_updated": {
      const fields = Array.isArray(d.fields) ? d.fields.join(", ") : "";
      const stockNote =
        typeof d.stockFrom === "number" && typeof d.stockTo === "number"
          ? ` — stock ${d.stockFrom} → ${d.stockTo}`
          : "";
      return `${d.slug ?? "—"} (${fields})${stockNote}`;
    }
    case "product_removed":
      return `${d.slug ?? "—"}`;
    case "order_status_changed":
      return `${d.orderId ?? "—"} → ${d.status ?? "—"}`;
    case "staff_added":
      return `${d.name ?? "—"} as ${d.role ?? "—"}`;
    case "staff_updated": {
      const fields = Array.isArray(d.fields) ? d.fields.join(", ") : "";
      return `${d.staffId ?? "—"} (${fields})`;
    }
    case "staff_removed":
      return `${d.staffId ?? "—"}`;
    case "settings_changed": {
      const fields = Array.isArray(d.fields) ? d.fields.join(", ") : "";
      return fields || "—";
    }
    default:
      return JSON.stringify(d);
  }
}

export default function AdminActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "activity_log"), orderBy("timestamp", "desc"), limit(200)),
      (snap) => {
        setEntries(snap.docs.map((d) => ({ ...(d.data() as Omit<ActivityEntry, "id">), id: d.id })));
      },
      () => setEntries([])
    );
    return () => unsub();
  }, []);

  if (entries === null) return <PageLoading />;

  return (
    <div>
      <AdminPageHeader
        title="Activity Log"
        description="Every staff action, most recent first. Admin-only, append-only."
      />

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-900/15 p-8 text-center text-sm text-ink-700/60">
          No activity recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-700/50">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {entries.map((entry) => {
                const suspicious = entry.details?.suspicious === true;
                return (
                  <tr key={entry.id} className={suspicious ? "bg-amber-500/10" : undefined}>
                    <td className="px-5 py-3 whitespace-nowrap text-ink-700/70">
                      {entry.timestamp ? entry.timestamp.toDate().toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-ink-900">
                      {entry.name}
                      {entry.role && <span className="text-ink-700/50"> · {entry.role}</span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-ink-900">
                      {suspicious && (
                        <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-600" />
                      )}
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td className="px-5 py-3 text-ink-700/70">{describeEntry(entry)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
