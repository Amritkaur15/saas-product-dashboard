"use client";

import { ProductRow } from "@/components/products/ProductRow";
import { PRODUCT_CATEGORIES } from "@/types/product";
import type {
  Product,
  ProductCategory,
  ProductFilters,
  ProductSortField,
  ProductStatus,
  SortDirection,
} from "@/types/product";

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  isAdmin: boolean;
  onCreateClick: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductList({
  products,
  loading,
  error,
  filters,
  onFiltersChange,
  isAdmin,
  onCreateClick,
  onEdit,
  onDelete,
}: ProductListProps) {
  function handleCategoryChange(value: string) {
    const category = (PRODUCT_CATEGORIES as readonly string[]).includes(value)
      ? (value as ProductCategory)
      : undefined;
    onFiltersChange({ ...filters, category });
  }

  function handleStatusChange(value: string) {
    const status =
      value === "active" || value === "inactive"
        ? (value as ProductStatus)
        : undefined;
    onFiltersChange({ ...filters, status });
  }

  const activeSortField = filters.sortBy ?? "createdAt";
  const activeDirection = filters.direction ?? "desc";

  // Clicking a new column sorts it ascending; clicking the active column
  // again toggles direction. Only price/createdAt are sortable — the two
  // fields the composite indexes in firestore.indexes.json cover.
  function handleSort(field: ProductSortField) {
    const direction: SortDirection =
      activeSortField === field && activeDirection === "asc" ? "desc" : "asc";
    onFiltersChange({ ...filters, sortBy: field, direction });
  }

  function ariaSortFor(field: ProductSortField): "ascending" | "descending" | "none" {
    if (activeSortField !== field) return "none";
    return activeDirection === "asc" ? "ascending" : "descending";
  }

  function sortIndicator(field: ProductSortField) {
    if (activeSortField !== field) return null;
    return <span aria-hidden="true">{activeDirection === "asc" ? "▲" : "▼"}</span>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 p-4">
        <div>
          <label
            htmlFor="filter-status"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status ?? ""}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-category"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category ?? ""}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onCreateClick}
            className="ml-auto rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add product
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="p-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="p-4 text-sm text-gray-500">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Products</caption>
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                <th scope="col" className="px-4 py-2">
                  Name
                </th>
                <th scope="col" className="px-4 py-2">
                  Category
                </th>
                <th scope="col" className="px-4 py-2" aria-sort={ariaSortFor("price")}>
                  <button
                    type="button"
                    onClick={() => handleSort("price")}
                    className="inline-flex items-center gap-1 uppercase hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
                  >
                    Price
                    {sortIndicator("price")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-2">
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-2"
                  aria-sort={ariaSortFor("createdAt")}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("createdAt")}
                    className="inline-flex items-center gap-1 uppercase hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
                  >
                    Created
                    {sortIndicator("createdAt")}
                  </button>
                </th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-2 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
