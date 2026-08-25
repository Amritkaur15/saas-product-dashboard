import type { Product } from "@/types/product";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface MetricsBarProps {
  products: Product[];
}

// Metrics summarize the currently filtered/sorted list, not the whole
// collection — there is no separate aggregate fetch (out of scope, see
// README), so "total" here means "total in view".
export function MetricsBar({ products }: MetricsBarProps) {
  const total = products.length;
  const activeCount = products.filter((p) => p.status === "active").length;
  const revenueTotal = products.reduce((sum, p) => sum + p.price, 0);

  const metrics = [
    { label: "Total products", value: total.toLocaleString() },
    { label: "Active products", value: activeCount.toLocaleString() },
    { label: "Revenue total", value: currency.format(revenueTotal) },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <dt className="text-sm font-medium text-gray-500">{metric.label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
