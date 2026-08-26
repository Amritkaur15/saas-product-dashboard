import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Shared fetch helper for client hooks: attaches a fresh ID token to every
// API call and normalizes error/empty-body handling in one place.
export async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Request failed");
  }

  return response.status === 204 ? null : response.json();
}
