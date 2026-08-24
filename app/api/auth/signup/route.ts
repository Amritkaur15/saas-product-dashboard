import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server/middleware";
import { handleError } from "@/lib/errors";
import * as userService from "@/lib/services/userService";

// Client-side signup only creates the Firebase Auth user; the role custom
// claim and the users/{uid} profile doc require the Admin SDK, so the
// client calls this immediately after with its own fresh ID token.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  try {
    const profile = await userService.completeSignup(auth.user.uid, auth.user.email ?? "");
    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
