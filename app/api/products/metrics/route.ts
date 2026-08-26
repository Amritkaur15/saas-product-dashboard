import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server/middleware";
import { handleError } from "@/lib/errors";
import * as productService from "@/lib/services/productService";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  try {
    const metrics = await productService.getMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
