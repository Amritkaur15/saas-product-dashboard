"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authorizedFetch } from "@/lib/auth/client/session";
import type { ProductMetrics } from "@/types/product";

interface UseProductMetricsResult {
  metrics: ProductMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Global catalog totals via GET /api/products/metrics, computed server-side
// so the client doesn't have to fetch the whole product collection just to
// show three numbers.
export function useProductMetrics(): UseProductMetricsResult {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // Same auth-not-resolved-yet guard as useProducts: no token to attach
    // until Firebase Auth settles, so fetching now would just 401.
    if (authLoading || !user) return;

    setLoading(true);
    setError(null);
    try {
      const data = (await authorizedFetch("/api/products/metrics")) as ProductMetrics;
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { metrics, loading, error, refresh };
}
