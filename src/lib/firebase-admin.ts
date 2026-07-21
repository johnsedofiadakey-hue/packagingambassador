import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
