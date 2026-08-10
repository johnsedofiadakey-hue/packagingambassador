import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase-admin";
import type { WholesaleOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function WaybillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getAdminDb();
  const doc = await db.collection("wholesaleOrders").doc(id).get();

  if (!doc.exists) {
    notFound();
  }

  const order = doc.data() as WholesaleOrder;
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-black sm:p-12">
      {/* Print Button */}
      <div className="mb-8 flex justify-end print:hidden">
        <a
          href="javascript:window.print()"
          className="inline-block rounded-full bg-forest-600 px-6 py-2 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Print / Save as PDF
        </a>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-forest-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-forest-900">WAYBILL</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">Order #{id.slice(0, 8).toUpperCase()}</p>
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
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Deliver To</h3>
            <p className="font-bold text-gray-900">{order.businessName}</p>
            <p className="text-gray-700">Attn: {order.contactName}</p>
            <p className="text-gray-700">{order.phone}</p>
            <p className="mt-2 whitespace-pre-wrap font-medium text-gray-900">{order.deliveryAddress}</p>
          </div>

          <div className="flex-1 text-right">
            <div className="mb-4">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Date</h3>
              <p className="font-medium text-gray-900">{date}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Shipping Method</h3>
              <p className="font-medium text-gray-900">Standard Delivery</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-12">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="border-b-2 border-forest-800 text-xs uppercase text-gray-900">
              <tr>
                <th className="py-3">Item Description</th>
                <th className="py-3 text-right">Quantity Shipped</th>
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
                  <td className="py-4 text-right font-medium text-gray-900">{line.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-24 grid grid-cols-2 gap-16">
          <div>
            <div className="border-b border-gray-400 pb-1"></div>
            <p className="mt-2 text-xs text-gray-500">Authorized Signature (Sender)</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-1"></div>
            <p className="mt-2 text-xs text-gray-500">Received By (Signature & Date)</p>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('load', () => window.print());` }} />
    </div>
  );
}
