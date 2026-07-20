import { LogIn, UserPlus } from "lucide-react";
import { PageHero } from "@/components/PageHero";

export default function AccountPage() {
  return (
    <div>
      <PageHero eyebrow="Your Account" title="Sign In" />

      <section className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-cream-200 bg-cream-50 p-8">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Email Address
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600">
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-full border border-ink-900/20 py-3 font-semibold text-ink-800 transition-colors hover:bg-cream-100">
              <UserPlus className="h-4 w-4" />
              Create Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
