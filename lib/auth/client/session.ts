import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
