"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { Leaf, LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/admin/dashboard");
    });
    return unsub;
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid email or password.");
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-100 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ink-900/8 bg-cream-50 p-8 shadow-lg shadow-ink-900/5">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunset-500 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display leading-tight">
            <span className="block text-lg font-bold text-ink-900">Packaging</span>
            <span className="block text-xs font-bold tracking-widest text-amber-600">
              ADMIN PORTAL
            </span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Email Address
            </label>
            <input
              required
              type="email"
              autoComplete="username"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
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
