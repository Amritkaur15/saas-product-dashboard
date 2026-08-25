import type { Product } from "@/types/product";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

interface ProductRowProps {
  product: Product;
  isAdmin: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductRow({ product, isAdmin, onEdit, onDelete }: ProductRowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{currency.format(product.price)}</td>
      <td className="px-4 py-3 text-sm">
        <span
          className={
            product.status === "active"
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
          }
        >
          {product.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {dateFormat.format(new Date(product.createdAt))}
      </td>
      {isAdmin && (
        <td className="px-4 py-3 text-right text-sm">
          <button
            type="button"
            onClick={() => onEdit(product)}
            aria-label={`Edit ${product.name}`}
            className="mr-3 font-medium text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            aria-label={`Delete ${product.name}`}
            className="font-medium text-red-600 hover:underline"
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}
