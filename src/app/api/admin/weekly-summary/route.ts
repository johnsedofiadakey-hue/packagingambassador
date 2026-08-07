import { NextResponse } from "next/server";
import { getAdminDb, verifyActiveStaff } from "@/lib/firebase-admin";
import { runWeeklySummary } from "@/lib/notifications/weekly-summary";

/**
 * Emails the weekly digest to the store owner. Two callers:
 *  - a staff member hitting "Send now" in the admin (Firebase ID token), and
 *  - Cloud Scheduler on a weekly cron, which has no user — it authenticates with a
 *    shared secret in the `x-cron-secret` header, matched against CRON_SECRET. If
 *    CRON_SECRET is unset, only the staff path works.
 */
async function authorize(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (cronSecret && provided && provided === cronSecret) return true;
  const uid = await verifyActiveStaff(request);
  return !!uid;
}

export async function POST(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runWeeklySummary(getAdminDb());
  return NextResponse.json(result);
}
