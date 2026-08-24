import "server-only";
import { type App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initAdminApp(): App {
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // .env files store the key as a single line with literal \n escapes;
      // restore real newlines before handing it to the SDK.
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Firestore.settings() can only be called once per instance, so it must run
// exactly when the app is freshly created, not on every module evaluation
// (dev hot reload re-evaluates this module against the same underlying app).
const isNewApp = getApps().length === 0;
const adminApp = isNewApp ? initAdminApp() : getApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

if (isNewApp) {
  // Repository writes omit absent optional fields (e.g. status on a
  // partial update) rather than passing explicit undefined, but guard
  // against Firestore's default rejection of undefined values anyway.
  adminDb.settings({ ignoreUndefinedProperties: true });
}
