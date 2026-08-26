import type { ProductMetrics } from "@/types/product";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface MetricsBarProps {
  metrics: ProductMetrics | null;
  loading: boolean;
}

// Metrics summarize the whole catalog, independent of the list's active
// filters — computed server-side by GET /api/products/metrics (see
// hooks/useProductMetrics.ts) rather than from a client-fetched product list.
export function MetricsBar({ metrics, loading }: MetricsBarProps) {
  // "—" while loading (or before the first response) rather than 0, so an
  // empty-because-not-fetched-yet state can't be mistaken for a real answer
  // of zero.
  const pending = loading || !metrics;

  const items = [
    { label: "Total products", value: pending ? "—" : metrics.total.toLocaleString() },
    { label: "Active products", value: pending ? "—" : metrics.activeCount.toLocaleString() },
    {
      label: "Revenue total",
      value: pending ? "—" : currency.format(metrics.revenueTotal),
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
