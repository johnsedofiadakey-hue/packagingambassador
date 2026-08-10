import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase-admin";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UniversalInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const db = getAdminDb();
  const { id: orderId } = await params;

  // Try retail first, then wholesale
  let doc = await db.collection("orders").doc(orderId).get();
  let channel: "retail" | "wholesale" = "retail";

  if (!doc.exists) {
    doc = await db.collection("wholesaleOrders").doc(orderId).get();
    channel = "wholesale";
  }

  if (!doc.exists) {
    notFound();
  }

  const order = doc.data()!;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  const customerName =
    channel === "wholesale"
      ? `${order.businessName} · ${order.contactName}`
      : order.customerName || "Walk-in Customer";
  const phone = order.phone || "—";
  const email = order.email;
  const address =
    channel === "wholesale" ? order.deliveryAddress : order.address;
  const paymentMethod = order.paymentMethod || "paystack";

  const PAYMENT_LABELS: Record<string, string> = {
    paystack: "Paystack",
    invoice: "Invoice",
    "pos-cash": "Cash (In-Store)",
    "pos-momo": "Mobile Money (In-Store)",
    "pos-card": "Card (In-Store)",
  };

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-black sm:p-12">
      {/* Print Button */}
      <div className="mb-8 flex justify-end gap-3 print:hidden">
        <a
          href="javascript:window.print()"
          className="rounded-full bg-forest-600 px-6 py-2 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Print / Save as PDF
        </a>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-forest-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-forest-900">INVOICE</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Order #{orderId.slice(0, 12).toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-forest-800">Packaging Ambassadors</h2>
            <p className="text-sm text-gray-600">Accra, Ghana</p>
            <p className="text-sm text-gray-600">info@packagingambassadors.com</p>
          </div>
        </div>

        {/* Customer & Details */}
        <div className="mt-8 flex justify-between gap-8">
          <div className="flex-1">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              {channel === "wholesale" ? "Billed To" : "Customer"}
            </h3>
            <p className="font-bold text-gray-900">{customerName}</p>
            <p className="text-gray-700">{phone}</p>
            {email && <p className="text-gray-700">{email}</p>}
            {address && (
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{address}</p>
            )}
          </div>

          <div className="flex-1 text-right">
            <div className="mb-4">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Invoice Date
              </h3>
              <p className="font-medium text-gray-900">{date}</p>
            </div>
            <div className="mb-4">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Payment Method
              </h3>
              <p className="font-medium text-gray-900">
                {PAYMENT_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Status
              </h3>
              <p className="font-medium uppercase text-gray-900">{order.status}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-12">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="border-b-2 border-forest-800 text-xs uppercase text-gray-900">
              <tr>
                <th className="py-3">Item Description</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.lines.map((line: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-4">
                    <p className="font-medium text-gray-900">{line.name}</p>
                    <p className="text-xs text-gray-500">
                      {line.color} · {line.size}
                    </p>
                  </td>
                  <td className="py-4 text-right">{line.quantity}</td>
                  <td className="py-4 text-right">{formatPrice(line.price)}</td>
                  <td className="py-4 text-right font-medium text-gray-900">
                    {formatPrice(line.price * line.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-900 pt-3 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>Thank you for your business.</p>
          <p>For inquiries, contact us at info@packagingambassadors.com</p>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.addEventListener('load', () => window.print());`,
        }}
      />
    </div>
  );
}
