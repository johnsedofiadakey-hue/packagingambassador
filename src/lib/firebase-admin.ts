import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Server-only. Never import this from a client component.
 *
 * On Firebase App Hosting (Cloud Run), Application Default Credentials
 * resolve automatically from the runtime service account. For local dev,
 * run `gcloud auth application-default login` once — without it, calls
 * using this module will throw instead of silently returning empty data.
 */
function getAdminApp(): App {
  const existing = getApps().find((app) => app.name === "admin");
  if (existing) return existing;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return initializeApp(
    {
      credential: serviceAccountJson
        ? cert(JSON.parse(serviceAccountJson))
        : applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    "admin"
  );
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

/**
 * Server-side guard for staff-only API routes. The admin portal's auth is otherwise
 * client-side only (a redirect in a layout effect), which does nothing to protect a
 * server route — anyone can POST to it directly. This verifies the Firebase ID token
 * in the `Authorization: Bearer <token>` header and confirms the caller has an
 * *active* staff doc. Returns the uid on success, or null (caller should 401).
 */
export async function verifyActiveStaff(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const staffSnap = await getAdminDb().collection("staff").doc(decoded.uid).get();
    if (!staffSnap.exists || staffSnap.data()?.active !== true) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}
