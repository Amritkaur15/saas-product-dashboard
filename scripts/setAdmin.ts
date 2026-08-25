/**
 * Promote a user to admin by setting a custom claim { role: "admin" }.
 *
 * Usage:
 *   npm run set-admin -- someone@example.com
 *
 * This runs standalone (outside Next.js), so it loads .env.local itself and
 * initializes its own Admin SDK app. Admin promotion is intentionally a
 * server-side, trusted operation — it can never be done from the client.
 */

import { config } from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Load environment variables from .env.local (Next.js does this automatically
// at runtime, but a standalone script must load them explicitly).
config({ path: ".env.local" });

function initAdmin() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private key stored in the env var has escaped "\n" sequences; convert them
  // back to real newlines so the PEM parses correctly.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Admin SDK credentials. Ensure FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set in .env.local.",
    );
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npm run set-admin -- <email>");
    process.exit(1);
  }

  initAdmin();

  const auth = getAuth();
  const db = getFirestore();

  try {
    const user = await auth.getUserByEmail(email);

    // 1. Set the custom claim — this is what the API and Security Rules read.
    await auth.setCustomUserClaims(user.uid, { role: "admin" });

    // 2. Keep the Firestore users doc in sync for display / rules convenience.
    await db.collection("users").doc(user.uid).set(
      { role: "admin" },
      { merge: true },
    );

    console.log(`\n${email} is now an admin.`);
    console.log("Sign out and back in for the new role to take effect.\n");
    process.exit(0);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? String(error.code) : "";

    if (code === "auth/user-not-found") {
      console.error(
        `\nNo user found with email "${email}". Sign up with this email in the app first, then re-run.\n`,
      );
    } else {
      console.error("\nFailed to set admin role:", error, "\n");
    }
    process.exit(1);
  }
}

main();
