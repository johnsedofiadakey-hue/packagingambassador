import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase-admin";
import type { WholesaleOrder } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const db = getAdminDb();
  const doc = await db.collection("wholesaleOrders").doc(params.id).get();

  if (!doc.exists) {
    notFound();
  }

  const order = doc.data() as WholesaleOrder;
  const date = order.createdAt ? new Date((order.createdAt as any)._seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-black sm:p-12">
      {/* Print Button (hidden in print mode) */}
      <div className="mb-8 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-full bg-forest-600 px-6 py-2 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-forest-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-forest-900">INVOICE</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">Order #{params.id.slice(0, 8).toUpperCase()}</p>
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
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Billed To</h3>
            <p className="font-bold text-gray-900">{order.customer.businessName}</p>
            <p className="text-gray-700">Attn: {order.customer.contactName}</p>
            <p className="text-gray-700">{order.customer.phone}</p>
            <p className="text-gray-700">{order.customer.email}</p>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">{order.customer.billingAddress || order.customer.deliveryAddress}</p>
          </div>

          <div className="flex-1 text-right">
            <div className="mb-4">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Date</h3>
              <p className="font-medium text-gray-900">{date}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Payment Status</h3>
              <p className="font-medium text-gray-900 uppercase">
                {order.status === "Paid" ? "Paid" : "Pending / Unpaid"}
              </p>
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
              {order.lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-4">
                    <p className="font-medium text-gray-900">{line.name}</p>
                    <p className="text-xs text-gray-500">
                      {line.color} · {line.size}
                    </p>
                  </td>
                  <td className="py-4 text-right">{line.quantity}</td>
                  <td className="py-4 text-right">{formatPrice(line.price)}</td>
                  <td className="py-4 text-right font-medium text-gray-900">{formatPrice(line.price * line.quantity)}</td>
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
            <div className="flex justify-between text-gray-700">
              <span>Shipping</span>
              <span>TBD</span>
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
      <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('load', () => window.print());` }} />
    </div>
  );
}
