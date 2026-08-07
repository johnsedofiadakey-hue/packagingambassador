import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb, verifyActiveStaff } from "@/lib/firebase-admin";
import {
  createPaidOrderIfNotExists,
  createPaidWholesaleOrderIfNotExists,
  isValidCartLine,
} from "@/lib/payments/create-paid-order";

/**
 * Gateway ↔ DB reconciliation. The one class of failure that leaves no trace in our own
 * database: a Paystack charge succeeded but the order-write never landed (closed tab,
 * dropped connection, webhook missed). The only way to find these is to diff Paystack's
 * own transaction list against our orders by reference — which is what this does — and,
 * where the charge metadata still carries the cart, rebuild the missing order on demand
 * through the same idempotent path the webhook uses. Staff-only.
 */
const PAYSTACK_BASE = "https://api.paystack.co";
const OUR_REF = /^PAW?-/; // PA- (retail) / PAW- (wholesale)

type PaystackTxn = {
  reference: string;
  amount: number; // pesewas
  currency: string;
  status: string;
  paid_at?: string;
  metadata?: Record<string, unknown> & { channel?: string; customer?: Record<string, unknown>; lines?: unknown; subtotal?: number };
  customer?: { email?: string };
};

async function fetchTransaction(reference: string, secretKey: string): Promise<PaystackTxn | null> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data ?? null;
}

async function orderExists(db: Firestore, reference: string): Promise<boolean> {
  const [r, w] = await Promise.all([
    db.collection("orders").where("paystackReference", "==", reference).limit(1).get(),
    db.collection("wholesaleOrders").where("paystackReference", "==", reference).limit(1).get(),
  ]);
  return !r.empty || !w.empty;
}

export async function POST(request: Request) {
  const uid = await verifyActiveStaff(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Paystack isn't configured on the server." }, { status: 500 });
  }

  const db = getAdminDb();
  const body = await request.json().catch(() => ({}));
  const action = body?.action === "reconstruct" ? "reconstruct" : "scan";

  if (action === "reconstruct") {
    const reference = typeof body.reference === "string" ? body.reference : "";
    if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

    const txn = await fetchTransaction(reference, secretKey);
    if (!txn || txn.status !== "success" || txn.currency !== "GHS") {
      return NextResponse.json({ error: "That transaction isn't a successful GHS charge." }, { status: 422 });
    }

    const meta = txn.metadata ?? {};
    const channel = meta.channel === "wholesale" ? "wholesale" : "retail";
    const customer = meta.customer as Record<string, unknown> | undefined;
    const lines = Array.isArray(meta.lines) ? meta.lines : null;
    const subtotal = typeof meta.subtotal === "number" ? meta.subtotal : txn.amount / 100;

    const validCustomer =
      channel === "wholesale"
        ? customer &&
          typeof customer.businessName === "string" &&
          typeof customer.contactName === "string" &&
          typeof customer.phone === "string" &&
          typeof customer.deliveryAddress === "string"
        : customer &&
          typeof customer.name === "string" &&
          typeof customer.phone === "string" &&
          typeof customer.address === "string";

    if (!validCustomer || !lines || lines.length === 0 || !lines.every(isValidCartLine) || !(subtotal > 0)) {
      return NextResponse.json(
        { error: "This charge's metadata can't rebuild the order — reconcile it manually." },
        { status: 422 }
      );
    }

    const result =
      channel === "wholesale"
        ? await createPaidWholesaleOrderIfNotExists({ reference, customer: customer as never, lines, subtotal, reconstructed: true })
        : await createPaidOrderIfNotExists({ reference, customer: customer as never, lines, subtotal, reconstructed: true });

    return NextResponse.json({ ok: true, orderId: result.order.id, created: result.created });
  }

  // scan
  const perPage = Math.min(Math.max(Number(body?.perPage) || 50, 1), 100);
  const listRes = await fetch(`${PAYSTACK_BASE}/transaction?status=success&perPage=${perPage}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!listRes.ok) {
    return NextResponse.json({ error: "Couldn't fetch transactions from Paystack." }, { status: 502 });
  }
  const listJson = await listRes.json().catch(() => null);
  const txns: PaystackTxn[] = Array.isArray(listJson?.data) ? listJson.data : [];

  const relevant = txns.filter(
    (t) => typeof t.reference === "string" && OUR_REF.test(t.reference) && t.status === "success" && t.currency === "GHS"
  );

  const unmatched: Array<{
    reference: string;
    amount: number;
    paidAt: string | null;
    channel: "retail" | "wholesale";
    customerName: string;
    reconstructable: boolean;
  }> = [];

  await Promise.all(
    relevant.map(async (t) => {
      if (await orderExists(db, t.reference)) return;
      const meta = t.metadata ?? {};
      const customer = (meta.customer ?? {}) as Record<string, unknown>;
      unmatched.push({
        reference: t.reference,
        amount: t.amount / 100,
        paidAt: t.paid_at ?? null,
        channel: meta.channel === "wholesale" ? "wholesale" : "retail",
        customerName:
          (customer.businessName as string) || (customer.name as string) || t.customer?.email || "—",
        reconstructable: Array.isArray(meta.lines) && meta.lines.length > 0 && !!meta.customer,
      });
    })
  );

  unmatched.sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
  return NextResponse.json({ scanned: relevant.length, unmatched });
}
