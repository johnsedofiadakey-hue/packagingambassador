import { getAdminDb } from "@/lib/firebase-admin";
import type { CartLine } from "@/lib/cart-context";

export type PaidOrderCustomer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
};

export type PaidOrderInput = {
  reference: string;
  customer: PaidOrderCustomer;
  lines: CartLine[];
  subtotal: number;
  /** Set only by the webhook fallback path — never by the primary verify route. */
  reconstructed?: boolean;
  /** Whether checkoutLocked was true in settings at the moment this order landed. */
  checkoutWasLocked?: boolean;
};

export type PaidOrderResult = {
  id: string;
  status: "Processing";
  createdAt: string;
  lines: CartLine[];
  subtotal: number;
};

function generateOrderId() {
  return `ORD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export function isValidCartLine(line: unknown): line is CartLine {
  if (!line || typeof line !== "object") return false;
  const l = line as Record<string, unknown>;
  return (
    typeof l.slug === "string" &&
    typeof l.name === "string" &&
    typeof l.price === "number" &&
    typeof l.unit === "string" &&
    typeof l.size === "string" &&
    typeof l.color === "string" &&
    typeof l.quantity === "number"
  );
}

/**
 * Idempotent on `paystackReference` — a retried verify call or a webhook arriving after
 * the primary path already succeeded both resolve to the same order, never a duplicate.
 */
export async function createPaidOrderIfNotExists(
  input: PaidOrderInput
): Promise<{ order: PaidOrderResult; created: boolean }> {
  const db = getAdminDb();

  const existing = await db
    .collection("orders")
    .where("paystackReference", "==", input.reference)
    .limit(1)
    .get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data();
    return {
      order: {
        id: doc.id,
        status: data.status,
        createdAt: data.createdAt,
        lines: data.lines,
        subtotal: data.subtotal,
      },
      created: false,
    };
  }

  const id = generateOrderId();
  const now = new Date().toISOString();
  const order = {
    id,
    createdAt: now,
    customerName: input.customer.name,
    phone: input.customer.phone,
    address: input.customer.address,
    lines: input.lines,
    subtotal: input.subtotal,
    status: "Processing" as const,
    paystackReference: input.reference,
    paidAt: now,
    // Firestore's Admin SDK (unlike the client SDK) rejects an explicit `undefined` value
    // outright — every optional field must be omitted entirely, not set to undefined.
    ...(input.customer.email ? { email: input.customer.email } : {}),
    ...(input.reconstructed ? { serverValidated: false, webhookReconstructed: true } : {}),
    ...(input.checkoutWasLocked ? { orderedWhileLocked: true } : {}),
  };

  await db.collection("orders").doc(id).set(order);

  return {
    order: { id: order.id, status: order.status, createdAt: order.createdAt, lines: order.lines, subtotal: order.subtotal },
    created: true,
  };
}
