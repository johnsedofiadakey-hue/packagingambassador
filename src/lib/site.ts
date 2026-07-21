/**
 * Canonical public base URL — used anywhere an absolute link is required
 * (email/SMS templates, the logo <img> src in emails). Update this the day a
 * custom domain goes live; everything else derives from it.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://packaging-ambassadors--packagingambassador.us-central1.hosted.app";
