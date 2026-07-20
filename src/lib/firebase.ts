import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // @ts-expect-error - temporary dev-only debug hook, removed before shipping
  window.__fb = { auth, db, storage, doc, setDoc, collection, getDocs };
}

/**
 * A secondary, independently-named Firebase app instance used only for
 * creating new staff Auth accounts from the admin panel. The Firebase client
 * SDK signs you in as whichever user you just created with
 * createUserWithEmailAndPassword — running that call against a secondary app
 * keeps the acting admin's session on the primary app untouched.
 */
export function getSecondaryAuth() {
  const secondaryApp = getApps().find((a) => a.name === "secondary")
    ?? initializeApp(firebaseConfig, "secondary");
  return getAuth(secondaryApp);
}
