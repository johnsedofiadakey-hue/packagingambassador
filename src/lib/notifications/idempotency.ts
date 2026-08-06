import { getAdminDb } from "@/lib/firebase-admin";

/**
 * True the first time this key is seen, false on every retry — backed by Firestore's
 * `.create()` (throws ALREADY_EXISTS if the doc is already there), not a read-then-write,
 * so it's safe under concurrent calls for the same key.
 */
export async function shouldSend(key: string): Promise<boolean> {
  try {
    await getAdminDb().collection("mail_log").doc(key).create({ sentAt: new Date().toISOString() });
    return true;
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 6) return false; // ALREADY_EXISTS
    console.error("[notifications] idempotency check failed, sending anyway", err);
    return true;
  }
}
