"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductList } from "@/components/products/ProductList";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import type { Product, ProductFilters, ProductInput } from "@/types/product";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const {
    products,
    loading: productsLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts(filters);

  // Metrics summarize the whole catalog, independent of the list's active
  // filters, so they're backed by their own unfiltered fetch rather than
  // the (possibly filtered) `products` above.
  const { products: allProducts, refresh: refreshMetrics } = useProducts();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <LoadingScreen />;
  }

  const isAdmin = role === "admin";

  function openCreateForm() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingProduct(null);
  }

  async function handleFormSubmit(input: ProductInput) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, input);
    } else {
      await createProduct(input);
    }
    await refreshMetrics();
    closeForm();
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    await deleteProduct(product.id);
    await refreshMetrics();
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Product dashboard</h1>
          <p className="text-sm text-gray-500">
            {user.email} · {role}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Log out
        </button>
      </header>

      <MetricsBar products={allProducts} />

      {formOpen && isAdmin && (
        <ProductForm product={editingProduct} onSubmit={handleFormSubmit} onCancel={closeForm} />
      )}

      <ProductList
        products={products}
        loading={productsLoading}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        isAdmin={isAdmin}
        onCreateClick={openCreateForm}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />
    </div>
  );
}
