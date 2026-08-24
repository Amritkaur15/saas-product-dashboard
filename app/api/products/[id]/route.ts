import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/server/middleware";
import { handleError } from "@/lib/errors";
import * as productService from "@/lib/services/productService";

export async function GET(req: Request, ctx: RouteContext<"/api/products/[id]">) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  try {
    const { id } = await ctx.params;
    const product = await productService.getProduct(id);
    return NextResponse.json(product);
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(req: Request, ctx: RouteContext<"/api/products/[id]">) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  const roleCheck = requireRole(auth.user, "admin");
  if (roleCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: roleCheck.error });
  }

  try {
    const { id } = await ctx.params;
    const input = await req.json();
    const product = await productService.updateProduct(id, input);
    return NextResponse.json(product);
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/products/[id]">) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  const roleCheck = requireRole(auth.user, "admin");
  if (roleCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: roleCheck.error });
  }

  try {
    const { id } = await ctx.params;
    await productService.deleteProduct(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
