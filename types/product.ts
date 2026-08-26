export type Role = "admin" | "viewer";

export type ProductStatus = "active" | "inactive";

// Fixed, hardcoded list rather than free text, so filtering never fragments
// across near-duplicate values (e.g. "cloth" vs "clothing"). Both the
// create/edit form and the filter dropdown read from this single list, and
// the Zod schema validates against it server-side. See the README's
// Database design section for the escalation path (a categories collection)
// if this ever needs to be managed without a redeploy.
export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food",
  "Books",
  "Home",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  status: ProductStatus;
  // ISO 8601 strings, not Firestore Timestamps: this type crosses the
  // repository -> service -> API -> UI boundary and must stay JSON-safe.
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  category: ProductCategory;
  price: number;
  status?: ProductStatus;
}

export type ProductSortField = "name" | "price" | "createdAt";

export type SortDirection = "asc" | "desc";

export interface ProductFilters {
  status?: ProductStatus;
  category?: ProductCategory;
  sortBy?: ProductSortField;
  direction?: SortDirection;
}

// Global catalog totals, independent of any list filter — see
// GET /api/products/metrics.
export interface ProductMetrics {
  total: number;
  activeCount: number;
  revenueTotal: number;
}
