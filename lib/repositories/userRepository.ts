import "server-only";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Role } from "@/types/product";
import type { UserProfile } from "@/types/user";

// The only file that may import Firestore for users.
const COLLECTION = "users";

function toUserProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    email: data.email,
    role: data.role,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
  };
}

export async function findById(uid: string): Promise<UserProfile | null> {
  const doc = await adminDb.collection(COLLECTION).doc(uid).get();
  return doc.exists ? toUserProfile(doc.id, doc.data() as DocumentData) : null;
}

export async function create(uid: string, email: string, role: Role): Promise<UserProfile> {
  const now = Timestamp.now();
  await adminDb.collection(COLLECTION).doc(uid).set({ email, role, createdAt: now });
  return toUserProfile(uid, { email, role, createdAt: now });
}
