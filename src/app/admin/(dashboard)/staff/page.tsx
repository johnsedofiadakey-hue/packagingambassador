"use client";

import { useState } from "react";
import { Info, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminData, type StaffMember, type StaffRole } from "@/lib/store";
import { useCurrentStaff } from "@/lib/useCurrentStaff";

const ROLES: StaffRole[] = ["Admin", "Sales Staff", "Inventory Staff"];

const ROLE_NOTE: Record<StaffRole, string> = {
  Admin: "Full access — products, categories, orders, staff, and settings.",
  "Sales Staff": "Orders and products (view only pricing) — no access to settings or staff.",
  "Inventory Staff": "Products and stock counts only — no pricing, orders, or settings access.",
};

function StaffForm({
  staff,
  onCancel,
  onSubmit,
}: {
  staff?: StaffMember;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    active: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(staff?.name ?? "");
  const [email, setEmail] = useState(staff?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>(staff?.role ?? "Sales Staff");
  const [active, setActive] = useState(staff?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), password, role, active });
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("auth/email-already-in-use")
          ? "That email already has an account."
          : "Couldn't save this staff member.";
      setError(message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-6">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {staff ? "Edit Staff Member" : "Add Staff Member"}
          </h2>
          <button onClick={onCancel} className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Full Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Email Address
            </label>
            <input
              required
              type="email"
              disabled={Boolean(staff)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-60"
            />
          </div>
          {!staff && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Temporary Password
              </label>
              <input
                required
                type="text"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
              <p className="mt-1.5 text-xs text-ink-700/60">
                Creates their real sign-in account. Share this with them — they can change it
                after logging in via Settings → Account.
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-700/60">{ROLE_NOTE[role]}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-cream-200"
            />
            Active
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : staff ? "Save Changes" : "Add Staff Member"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-ink-900/15 px-6 py-3 font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStaffPage() {
  const { staff, addStaff, updateStaff, removeStaff } = useAdminData();
  const { user } = useCurrentStaff();
  const [editing, setEditing] = useState<StaffMember | "new" | null>(null);

  return (
    <div>
      <AdminPageHeader
        title="Staff Accounts"
        description={`${staff.length} staff record${staff.length === 1 ? "" : "s"}`}
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        }
      />

      <div className="mb-5 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-ink-800">
        <Info className="h-5 w-5 shrink-0 text-amber-600" />
        <p>
          Adding a staff member here creates a real Firebase sign-in account for them — they can
          log in at <strong>/admin/login</strong> immediately with the temporary password you set.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="px-5 py-3 font-medium text-ink-900">{member.name}</td>
                <td className="px-5 py-3 text-ink-700/80">{member.email}</td>
                <td className="px-5 py-3 text-ink-700/80">{member.role}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      member.active
                        ? "rounded-full bg-forest-800/10 px-2.5 py-1 text-xs font-semibold text-forest-800"
                        : "rounded-full bg-ink-900/10 px-2.5 py-1 text-xs font-semibold text-ink-700/60"
                    }
                  >
                    {member.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(member)}
                      aria-label={`Edit ${member.name}`}
                      className="rounded-full p-2 text-ink-700 hover:bg-amber-500/10 hover:text-amber-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (member.id === user?.uid) {
                          alert("You can't remove your own staff record while signed in as them.");
                          return;
                        }
                        if (confirm(`Remove ${member.name} from staff?`)) {
                          removeStaff(member.id);
                        }
                      }}
                      aria-label={`Remove ${member.name}`}
                      className="rounded-full p-2 text-ink-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <StaffForm
          staff={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            if (editing === "new") {
              await addStaff(values);
            } else {
              await updateStaff(editing.id, {
                name: values.name,
                role: values.role,
                active: values.active,
              });
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
