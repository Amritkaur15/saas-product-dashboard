"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth/client/session";
import type { Product, ProductFilters, ProductInput } from "@/types/product";

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<void>;
  updateProduct: (id: string, input: ProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Request failed");
  }

  return response.status === 204 ? null : response.json();
}

function buildQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.direction) params.set("direction", filters.direction);
  const query = params.toString();
  return query ? `?${query}` : "";
}

// The single client-side place that calls the product API, so components
// don't each duplicate fetch + token + loading/error plumbing.
export function useProducts(filters: ProductFilters = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await authorizedFetch(
        `/api/products${buildQuery(filters)}`,
      )) as Product[];
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
    // Depend on primitive filter fields, not the filters object itself,
    // so a fresh object literal from the caller doesn't refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category, filters.sortBy, filters.direction]);

  useEffect(() => {
    // Classic fetch-on-mount/filter-change pattern: refresh's setLoading
    // and setError calls are the intended loading-state UX for a REST
    // hook, not derived data or an external-store sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const createProduct = useCallback(
    async (input: ProductInput) => {
      await authorizedFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refresh();
    },
    [refresh],
  );

  const updateProduct = useCallback(
    async (id: string, input: ProductInput) => {
      await authorizedFetch(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
      await refresh();
    },
    [refresh],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await authorizedFetch(`/api/products/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  return { products, loading, error, refresh, createProduct, updateProduct, deleteProduct };
}
