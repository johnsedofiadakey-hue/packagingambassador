"use client";

import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-5"
    >
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Your Name
        </label>
        <input
          required
          type="text"
          placeholder="John Smith"
          className="mt-2 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Email Address
        </label>
        <input
          required
          type="email"
          placeholder="example@gmail.com"
          className="mt-2 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Subject
        </label>
        <input
          required
          type="text"
          placeholder="Bulk order inquiry"
          className="mt-2 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
          Message
        </label>
        <textarea
          required
          rows={4}
          placeholder="Tell us what you need..."
          className="mt-2 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
      >
        {sent ? "Message Sent ✓" : "Send Message"}
      </button>
    </form>
  );
}
