import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { CartLine } from "@/lib/cart-context";
import { sendLowStockAlert } from "@/lib/notifications/send-low-stock-alert";

export type StockShortfall = { slug: string; name: string; requested: number; available: number };
export type LowStockItem = { slug: string; name: string; stock: number };

function aggregateBySlug(lines: CartLine[]) {
  const perSlug = new Map<string, number>();
  for (const line of lines) {
    perSlug.set(line.slug, (perSlug.get(line.slug) ?? 0) + line.quantity);
  }
  return perSlug;
}

/**
 * Decrement stock and bump unitsSold for every ordered product inside ONE transaction, so
 * concurrent checkouts can't lose an update, and report any product that went short. Because
 * payment has already succeeded by the time this runs, a shortfall never rejects the order —
 * it's surfaced so staff can reconcile. A line for a since-deleted product is skipped, not fatal.
 */
export async function applyStockDeduction(db: Firestore, lines: CartLine[]): Promise<StockShortfall[]> {
  const perSlug = aggregateBySlug(lines);
  const slugs = [...perSlug.keys()];
  if (slugs.length === 0) return [];
  const refs = slugs.map((s) => db.collection("products").doc(s));
  const shortfalls: StockShortfall[] = [];

  try {
    await db.runTransaction(async (tx) => {
      shortfalls.length = 0; // reset — the callback can re-run on contention
      const snaps = await Promise.all(refs.map((r) => tx.get(r)));
      snaps.forEach((snap, i) => {
        if (!snap.exists) return;
        const slug = slugs[i];
        const qty = perSlug.get(slug)!;
        const data = snap.data() ?? {};
        const current = typeof data.stock === "number" ? data.stock : 0;
        const next = current - qty;
        if (next < 0) {
          shortfalls.push({ slug, name: (data.name as string) ?? slug, requested: qty, available: current });
        }
        tx.update(refs[i], { stock: next, unitsSold: FieldValue.increment(qty) });
      });
    });
  } catch (err) {
    console.error("[stock] deduction transaction failed", err);
  }
  return shortfalls;
}

/**
 * State-based low-stock flagging, safe to call from any order path after stock is written.
 * Reads each product's current stock and toggles a `lowStockAlerted` dedup flag: sets it (and
 * reports the product) when stock is at/below the threshold and it wasn't already flagged;
 * clears it once a restock lifts stock back above the threshold so a future dip re-alerts.
 */
export async function reconcileLowStockFlags(
  db: Firestore,
  slugs: string[],
  threshold: number
): Promise<LowStockItem[]> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return [];
  const refs = unique.map((s) => db.collection("products").doc(s));
  const newlyLow: LowStockItem[] = [];
  try {
    const snaps = await Promise.all(refs.map((r) => r.get()));
    await Promise.all(
      snaps.map(async (snap, i) => {
        if (!snap.exists) return;
        const data = snap.data() ?? {};
        const stock = typeof data.stock === "number" ? data.stock : 0;
        const alerted = data.lowStockAlerted === true;
        if (stock <= threshold && !alerted) {
          newlyLow.push({ slug: unique[i], name: (data.name as string) ?? unique[i], stock });
          await refs[i].update({ lowStockAlerted: true }).catch(() => {});
        } else if (stock > threshold && alerted) {
          await refs[i].update({ lowStockAlerted: false }).catch(() => {});
        }
      })
    );
  } catch (err) {
    console.error("[stock] low-stock reconcile failed", err);
  }
  return newlyLow;
}

/** Store-level inventory config, read once per order settlement. */
export async function getInventorySettings(db: Firestore) {
  const snap = await db.collection("settings").doc("store").get().catch(() => null);
  const data = snap?.data() ?? {};
  return {
    threshold: typeof data.lowStockThreshold === "number" ? data.lowStockThreshold : 20,
    storeEmail: typeof data.storeEmail === "string" ? data.storeEmail : undefined,
    storeName: typeof data.storeName === "string" ? data.storeName : undefined,
    fromAddress: typeof data.emailFromAddress === "string" ? data.emailFromAddress : undefined,
  };
}

/**
 * One call every order path uses: atomically deduct stock, reconcile low-stock flags, and fire
 * the owner alert for anything that just crossed the threshold. Returns any shortfalls so the
 * caller can flag the order for review. All of it is best-effort and never throws.
 */
export async function settleInventoryForOrder(db: Firestore, lines: CartLine[]): Promise<StockShortfall[]> {
  const shortfalls = await applyStockDeduction(db, lines);
  const { threshold, storeEmail, storeName, fromAddress } = await getInventorySettings(db);
  const newlyLow = await reconcileLowStockFlags(db, lines.map((l) => l.slug), threshold);
  if (newlyLow.length > 0) {
    await sendLowStockAlert({ items: newlyLow, threshold, storeEmail, storeName, fromAddress }).catch((err) =>
      console.error("[low-stock] alert failed", err)
    );
  }
  return shortfalls;
}
