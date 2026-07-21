/**
 * In-memory sliding-window rate limiter. Per-process only — on Cloud Run this
 * resets on cold start and isn't shared across instances if the app scales
 * beyond one, but that's an acceptable tradeoff for a low-traffic store and
 * far better than no limit at all. Revisit with a Firestore- or Redis-backed
 * limiter if abuse actually shows up.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const retryAfterMs = windowMs - (now - timestamps[0]);
    return { ok: false as const, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { ok: true as const };
}
