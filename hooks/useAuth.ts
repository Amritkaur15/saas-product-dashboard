"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase/client";
import type { Role } from "@/types/product";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      // Role lives in the ID token's custom claim, not on the user object
      // itself, so it takes a token round trip to read.
      const tokenResult = await nextUser?.getIdTokenResult();
      setRole(tokenResult?.claims.role === "admin" ? "admin" : nextUser ? "viewer" : null);
      setLoading(false);
    });
  }, []);

  return createElement(AuthContext.Provider, { value: { user, role, loading } }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
