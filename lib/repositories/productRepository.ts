import "server-only";
import { Timestamp, type DocumentData, type Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Product, ProductFilters, ProductInput } from "@/types/product";

// The only file that may import Firestore for products. Also owns
// createdAt/updatedAt (set here, not in the service) since it already
// holds the Firestore Timestamp dependency.
const COLLECTION = "products";

function productsCollection() {
  return adminDb.collection(COLLECTION);
}

function toProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: data.name,
    category: data.category,
    price: data.price,
    status: data.status,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
  };
}

export async function findAll(filters: ProductFilters): Promise<Product[]> {
  let query: Query = productsCollection();

  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }
  if (filters.category) {
    query = query.where("category", "==", filters.category);
  }

  query = query.orderBy(filters.sortBy ?? "createdAt", filters.direction ?? "desc");

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => toProduct(doc.id, doc.data()));
}

export async function findById(id: string): Promise<Product | null> {
  const doc = await productsCollection().doc(id).get();
  return doc.exists ? toProduct(doc.id, doc.data() as DocumentData) : null;
}

export async function create(data: Required<ProductInput>): Promise<Product> {
  const now = Timestamp.now();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await productsCollection().add(payload);
  return toProduct(ref.id, payload);
}

export async function update(id: string, data: ProductInput): Promise<Product> {
  const ref = productsCollection().doc(id);
  await ref.update({ ...data, updatedAt: Timestamp.now() });
  const snapshot = await ref.get();
  return toProduct(snapshot.id, snapshot.data() as DocumentData);
}

export async function remove(id: string): Promise<void> {
  await productsCollection().doc(id).delete();
}
