import { Check, Clock, Package, Truck, XCircle } from "lucide-react";
import type { OrderStatus } from "@/lib/store";

const STEPS: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: "Pending", label: "Order Placed", icon: Clock },
  { status: "Processing", label: "Processing", icon: Package },
  { status: "Delivered", label: "Delivered", icon: Truck },
];

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-clay-700/20 bg-clay-700/5 px-5 py-4">
        <XCircle className="h-6 w-6 shrink-0 text-clay-700" />
        <div>
          <p className="font-semibold text-ink-900">Order Cancelled</p>
          <p className="text-sm text-ink-700/70">
            This order was cancelled. Contact us if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.status} className={`flex ${isLast ? "" : "flex-1"} items-start`}>
            <div className="flex flex-col items-center">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  done ? "bg-amber-500 text-white" : "bg-sand-200 text-ink-700/40"
                }`}
              >
                {i < currentIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </span>
              <p
                className={`mt-2 max-w-20 text-center text-xs font-semibold ${
                  done ? "text-ink-900" : "text-ink-700/40"
                }`}
              >
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div
                className={`mt-5 h-0.5 flex-1 transition-colors ${
                  i < currentIndex ? "bg-amber-500" : "bg-sand-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
