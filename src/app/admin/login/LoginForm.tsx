"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ArrowLeft, LogIn } from "lucide-react";
import { Logo } from "@/components/Logo";
import { auth } from "@/lib/firebase";
import { useCurrentStaff } from "@/lib/useCurrentStaff";

export function LoginForm() {
  const router = useRouter();
  const { user, staffDoc, loading } = useCurrentStaff();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Only redirect once we've actually confirmed this account is active staff —
  // not just that *some* Firebase user is signed in. Redirecting on any signed-in
  // user (the old behavior) caused an infinite login <-> dashboard bounce for any
  // account without a valid active staff doc, since the dashboard's own guard
  // would immediately redirect back here and this effect would fire again.
  useEffect(() => {
    if (!loading && user && staffDoc?.active) {
      router.replace("/admin/dashboard");
    }
  }, [loading, user, staffDoc, router]);

  const unauthorized = !loading && Boolean(user) && !staffDoc?.active;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The effect above redirects once useCurrentStaff confirms this account
      // has active staff access — no need to navigate here.
    } catch {
      setError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-sand-300 via-sand-200 to-sand-100 px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700 transition-colors hover:text-amber-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to site
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-white/50 bg-white/70 p-8 shadow-xl shadow-ink-900/10 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <Logo className="h-10" />
          <span className="font-display leading-tight">
            <span className="block text-lg font-bold text-ink-900">Packaging</span>
            <span className="block text-xs font-bold tracking-widest text-amber-600">
              ADMIN PORTAL
            </span>
          </span>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Email Address
            </label>
            <input
              required
              type="email"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@packagingambassador.com"
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Password
            </label>
            <input
              required
              type="password"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>

          {(error || unauthorized) && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error ?? "This account isn't set up for admin access yet. Contact an administrator."}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
