export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ProductVariantResponse {
  id: number;
  color: string | null;
  size: { id: number; name: string } | null;
  sku: string;
  price: number;
  priceAfterDiscount: number | null;
  soldQuantity: number;
  availableQuantity: number;
}

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  /** null = general image shown for every color */
  color: string | null;
  sortOrder: number | null;
}

export type CatalogStatus = "ACTIVE" | "ARCHIVED";

export interface ProductResponse {
  id: number;
  status: CatalogStatus;
  title: string;
  slug: string;
  description: string | null;
  imageCover: string | null;
  ratingsAverage: number;
  ratingsQuantity: number;
  subCategory: { subCategoryId: number; subCategoryName: string } | null;
  brand: { brandId: number; brandName: string } | null;
  variants: ProductVariantResponse[] | null;
  images: ProductImageResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantRequest {
  id?: number;
  color?: string;
  sizeId?: number;
  sku: string;
  price: number;
  priceAfterDiscount?: number;
  /** Opening stock; only used when the variant is new. */
  initialStock?: number;
}

export interface ProductImageRequest {
  id?: number;
  imageUrl: string;
  color?: string;
  sortOrder?: number;
}

export interface ProductRequest {
  title: string;
  slug: string;
  description?: string;
  imageCover?: string;
  subCategoryId: number;
  brandId?: number;
  variants: ProductVariantRequest[];
  images?: ProductImageRequest[];
}

export interface ProductStatsResponse {
  totalProducts: number;
  newThisMonth: number;
  activeProducts: number;
  activeProductsPercent: number;
  lowStock: number;
  outOfStock: number;
  archivedProducts: number;
}

export interface ProductQuery {
  page?: number;
  size?: number;
  title?: string;
  brandId?: number;
  subCategoryId?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  // The API defaults to ACTIVE (what the shop shows)
  status?: CatalogStatus | "ALL";
  // Spring pageable sort, e.g. "createdAt,desc" or "title,asc"
  sort?: string;
}

export type ProductFilters = Pick<
  ProductQuery,
  "brandId" | "subCategoryId" | "minPrice" | "maxPrice" | "minRating"
>;
