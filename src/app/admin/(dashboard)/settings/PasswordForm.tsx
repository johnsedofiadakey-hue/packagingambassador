"use client";

import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { KeyRound } from "lucide-react";
import { auth } from "@/lib/firebase";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) {
      setError("You need to be signed in to change your password.");
      return;
    }

    setPending(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Current password is incorrect.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Current Password
        </label>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          New Password
        </label>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Confirm New Password
        </label>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-forest-800/10 px-3 py-2 text-sm text-forest-800">
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
      >
        <KeyRound className="h-4 w-4" />
        {pending ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
