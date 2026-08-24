import "server-only";
import { adminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/types/product";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  role: Role;
}

export type RequireAuthResult = { user: AuthenticatedUser } | { error: number };

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

// Verify the token with the Admin SDK; never manually decode a JWT.
export async function requireAuth(req: Request): Promise<RequireAuthResult> {
  const token = extractBearerToken(req);
  if (!token) {
    return { error: 401 };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    // Custom claims are untyped on DecodedIdToken; fail closed to "viewer"
    // for anything that isn't exactly the "admin" claim.
    const role: Role = decoded.role === "admin" ? "admin" : "viewer";

    return {
      user: { uid: decoded.uid, email: decoded.email ?? null, role },
    };
  } catch {
    return { error: 401 };
  }
}

export function requireRole(user: AuthenticatedUser, role: Role): { error: number } | null {
  return user.role === role ? null : { error: 403 };
}
