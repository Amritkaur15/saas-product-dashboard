export type Role = "admin" | "viewer";

export type ProductStatus = "active" | "inactive";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  // ISO 8601 strings, not Firestore Timestamps: this type crosses the
  // repository -> service -> API -> UI boundary and must stay JSON-safe.
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  status?: ProductStatus;
}

export type ProductSortField = "name" | "price" | "createdAt";

export type SortDirection = "asc" | "desc";

export interface ProductFilters {
  status?: ProductStatus;
  category?: string;
  sortBy?: ProductSortField;
  direction?: SortDirection;
}
