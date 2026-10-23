import type { SubCategory } from "@/features/sub-categories/types/sub-category.types";

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
  slug: string;
  image: string;
}

export interface CategoryDetailProduct {
  id: number;
  name?: string;
  slug?: string;
  price?: number | null;
  image?: string;
  imageUrl?: string | null;
  stock?: number;
}

// Normalized row the page renders. productCount is null when the API omits products.
export interface CategoryDetailSubCategory {
  id: number;
  name: string;
  slug: string | null;
  productCount: number | null;
}

export interface CategoryDetail extends Category {
  subCategories: CategoryDetailSubCategory[];
}

// The API has sent sub-categories both nested ({ subCategory, products }) and
// flat ({ id, name, slug, products, ... }); accept either.
export type CategoryDetailSubCategoryResponse =
  | { subCategory: SubCategory; products: CategoryDetailProduct[] | null }
  | { id: number; name: string; slug: string | null; products: CategoryDetailProduct[] | null };

export interface CategoryDetailResponse extends Category {
  subCategories: CategoryDetailSubCategoryResponse[] | null;
}
