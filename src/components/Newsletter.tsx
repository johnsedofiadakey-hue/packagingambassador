"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email) return;
        setSubmitted(true);
      }}
      className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="glass w-full rounded-full px-5 py-3 text-sm text-ink-900 placeholder:text-ink-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
      >
        {submitted ? "Subscribed ✓" : "Subscribe"}
      </button>
    </form>
  );
}
