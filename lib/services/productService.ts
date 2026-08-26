import { NotFoundError, ValidationError } from "@/lib/errors";
import * as productRepository from "@/lib/repositories/productRepository";
import { productInputSchema } from "@/lib/validation/productSchema";
import type { Product, ProductFilters, ProductInput, ProductMetrics } from "@/types/product";

function parseInput(input: unknown): Required<ProductInput> {
  const result = productInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? "Invalid input");
  }
  return { ...result.data, status: result.data.status ?? "active" };
}

export async function listProducts(filters: ProductFilters): Promise<Product[]> {
  return productRepository.findAll(filters);
}

// Global catalog totals, independent of any list filter. Reuses the same
// unfiltered read findAll({}) already provides rather than adding a
// dedicated repository method.
export async function getMetrics(): Promise<ProductMetrics> {
  const products = await productRepository.findAll({});
  return {
    total: products.length,
    activeCount: products.filter((p) => p.status === "active").length,
    revenueTotal: products.reduce((sum, p) => sum + p.price, 0),
  };
}

export async function getProduct(id: string): Promise<Product> {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  return product;
}

export async function createProduct(input: unknown): Promise<Product> {
  const data = parseInput(input);
  return productRepository.create(data);
}

export async function updateProduct(id: string, input: unknown): Promise<Product> {
  const data = parseInput(input);

  const existing = await productRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("Product not found");
  }

  return productRepository.update(id, data);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await productRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("Product not found");
  }

  await productRepository.remove(id);
}
