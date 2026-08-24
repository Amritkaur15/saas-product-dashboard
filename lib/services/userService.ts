import { adminAuth } from "@/lib/firebase/admin";
import * as userRepository from "@/lib/repositories/userRepository";
import type { UserProfile } from "@/types/user";

// Idempotent: if this uid already has a profile (e.g. the client retries,
// or an admin's browser re-hits this endpoint), leave their role claim
// untouched instead of resetting a promoted admin back to "viewer".
export async function completeSignup(uid: string, email: string): Promise<UserProfile> {
  const existing = await userRepository.findById(uid);
  if (existing) {
    return existing;
  }

  await adminAuth.setCustomUserClaims(uid, { role: "viewer" });
  return userRepository.create(uid, email, "viewer");
}
