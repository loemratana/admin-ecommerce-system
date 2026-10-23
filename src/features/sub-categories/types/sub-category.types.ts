export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  categoryId: number;
  categoryName?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategoryPayload {
  name: string;
  slug: string;
  categoryId: number;
  /** "" clears the image. */
  image: string;
}

export interface SubCategoryProduct {
  id: number;
  name: string;
  slug: string;
  price: number | null;
  imageUrl: string | null;
}

// GET /sub-categories/{id} returns the parent category and products nested,
// unlike the list endpoint which only carries categoryId.
export interface SubCategoryDetail {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  // Older backend builds sent category.id as null, so callers must handle that.
  category: { id: number | null; name: string; slug: string } | null;
  products: SubCategoryProduct[];
  createdAt?: string;
  updatedAt?: string;
}

// Older backend builds return the flat list shape (categoryId/categoryName, no products).
export type SubCategoryDetailResponse = Omit<SubCategoryDetail, "products" | "category"> & {
  category?: SubCategoryDetail["category"];
  products?: SubCategoryProduct[] | null;
  categoryId?: number;
  categoryName?: string;
};
