"use client";

import { ProductRow } from "@/components/products/ProductRow";
import type {
  Product,
  ProductFilters,
  ProductSortField,
  ProductStatus,
  SortDirection,
} from "@/types/product";
import { useState } from "react";

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
  // Local draft so category filtering applies on submit, not per keystroke.
  const [categoryDraft, setCategoryDraft] = useState(filters.category ?? "");

  function applyCategory() {
    onFiltersChange({
      ...filters,
      category: categoryDraft.trim() || undefined,
    });
  }

  function handleStatusChange(value: string) {
    const status =
      value === "active" || value === "inactive"
        ? (value as ProductStatus)
        : undefined;
    onFiltersChange({ ...filters, status });
  }

  function handleSortByChange(value: string) {
    const sortBy =
      value === "name" || value === "price" || value === "createdAt"
        ? (value as ProductSortField)
        : undefined;
    onFiltersChange({ ...filters, sortBy });
  }

  function handleDirectionChange(value: string) {
    const direction =
      value === "asc" || value === "desc"
        ? (value as SortDirection)
        : undefined;
    onFiltersChange({ ...filters, direction });
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyCategory();
          }}
          className="flex items-end gap-2"
        >
          <div>
            <label
              htmlFor="filter-category"
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              Category
            </label>
            <input
              id="filter-category"
              value={categoryDraft}
              onChange={(event) => setCategoryDraft(event.target.value)}
              placeholder="e.g. Electronics"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Apply
          </button>
        </form>

        <div>
          <label
            htmlFor="filter-sort"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Sort by
          </label>
          <select
            id="filter-sort"
            value={filters.sortBy ?? "createdAt"}
            onChange={(event) => handleSortByChange(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="createdAt">Date created</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-direction"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Direction
          </label>
          <select
            id="filter-direction"
            value={filters.direction ?? "desc"}
            onChange={(event) => handleDirectionChange(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
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
                <th scope="col" className="px-4 py-2">
                  Price
                </th>
                <th scope="col" className="px-4 py-2">
                  Status
                </th>
                <th scope="col" className="px-4 py-2">
                  Created
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
