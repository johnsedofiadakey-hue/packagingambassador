import { getAdminDb } from "@/lib/firebase-admin";
import { formatPrice } from "@/lib/utils";
import { notFound } from "next/navigation";
import Script from "next/script";

export const dynamic = 'force-dynamic';

export default async function POSReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getAdminDb();

  let orderData = null;
  const orderRef = await db.collection("orders").doc(id).get();
  if (orderRef.exists) {
    orderData = orderRef.data();
  } else {
    const wholesaleRef = await db.collection("wholesaleOrders").doc(id).get();
    if (wholesaleRef.exists) {
      orderData = wholesaleRef.data();
    }
  }

  if (!orderData) {
    notFound();
  }

  const customerName = orderData.customerName || orderData.businessName || "Walk-in Customer";
  const date = new Date(orderData.createdAt).toLocaleString();
  
  const paymentLabels: Record<string, string> = {
    "pos-cash": "Cash",
    "pos-momo": "Mobile Money",
    "pos-card": "Card",
  };
  const paymentMethodStr = paymentLabels[orderData.paymentMethod] || orderData.paymentMethod;

  return (
    <div className="min-h-screen bg-white text-black p-8 font-mono text-sm max-w-[80mm] mx-auto print:p-0 print:m-0 print:max-w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold font-display uppercase">Packaging Ambassadors</h1>
        <p className="text-xs mt-1">Accra, Ghana</p>
        <p className="text-xs">+233 XX XXX XXXX</p>
      </div>

      <div className="mb-6 space-y-1 border-b border-dashed border-gray-400 pb-4">
        <p><strong>Receipt #:</strong> {orderData.id}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Customer:</strong> {customerName}</p>
        <p><strong>Payment:</strong> {paymentMethodStr}</p>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-dashed border-gray-400">
            <th className="text-left py-2 font-semibold">Item</th>
            <th className="text-right py-2 font-semibold">Qty</th>
            <th className="text-right py-2 font-semibold">Price</th>
            <th className="text-right py-2 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {orderData.lines?.map((line: any, i: number) => (
            <tr key={i} className="border-b border-dashed border-gray-200">
              <td className="py-2">
                <div>{line.name}</div>
                <div className="text-xs text-gray-500">{line.color}, {line.size}</div>
              </td>
              <td className="text-right py-2 align-top">{line.quantity}</td>
              <td className="text-right py-2 align-top">{formatPrice(line.price)}</td>
              <td className="text-right py-2 align-top">{formatPrice(line.price * line.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center font-bold text-lg border-t border-dashed border-gray-400 pt-4 mb-8">
        <span>Total:</span>
        <span>{formatPrice(orderData.subtotal)}</span>
      </div>

      <div className="text-center text-xs space-y-2 pb-8">
        <p>Thank you for your business!</p>
        <p>Returns accepted within 7 days with original receipt.</p>
      </div>

      <div className="print:hidden fixed bottom-4 right-4 flex gap-4">
        <a 
          href="javascript:window.close()" 
          className="bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 inline-block text-center"
        >
          Close
        </a>
        <a 
          href="javascript:window.print()" 
          className="bg-ink-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-ink-800 inline-block text-center"
        >
          Print Receipt
        </a>
      </div>

      <Script id="auto-print" strategy="lazyOnload">
        {`window.print();`}
      </Script>
    </div>
  );
}
