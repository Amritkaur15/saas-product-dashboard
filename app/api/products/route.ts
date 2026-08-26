import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/server/middleware";
import { handleError } from "@/lib/errors";
import * as productService from "@/lib/services/productService";
import { PRODUCT_CATEGORIES } from "@/types/product";
import type { ProductCategory, ProductFilters } from "@/types/product";

function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

function parseFilters(searchParams: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};

  const status = searchParams.get("status");
  if (status === "active" || status === "inactive") {
    filters.status = status;
  }

  const category = searchParams.get("category");
  if (category && isProductCategory(category)) {
    filters.category = category;
  }

  const sortBy = searchParams.get("sortBy");
  if (sortBy === "name" || sortBy === "price" || sortBy === "createdAt") {
    filters.sortBy = sortBy;
  }

  const direction = searchParams.get("direction");
  if (direction === "asc" || direction === "desc") {
    filters.direction = direction;
  }

  return filters;
}

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  try {
    const { searchParams } = new URL(req.url);
    const products = await productService.listProducts(parseFilters(searchParams));
    return NextResponse.json(products);
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if ("error" in auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.error });
  }

  const roleCheck = requireRole(auth.user, "admin");
  if (roleCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: roleCheck.error });
  }

  try {
    const input = await req.json();
    const product = await productService.createProduct(input);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
