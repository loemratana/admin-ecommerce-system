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
  status?: CatalogStatus;
  color: string | null;
  size: { id: number; name: string } | null;
  sku: string;
  price: number;
  /** The variant's OWN discount (null = falls back to the product's discount). */
  discountPercent?: number | null;
  /** Discount actually applied: the variant's own, else the product-wide one. */
  effectiveDiscountPercent?: number | null;
  discountAmount?: number | null;
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

/** Who a product is for; the shop's Men / Women tabs also include UNISEX products. */
export type ProductType = "MEN" | "WOMEN" | "UNISEX";

export const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
  { value: "UNISEX", label: "Unisex" },
];

export interface ProductResponse {
  id: number;
  status: CatalogStatus;
  productType: ProductType | null;
  title: string;
  slug: string;
  description: string | null;
  imageCover: string | null;
  /** Product-wide discount; variants without their own discount use it. */
  discountPercent?: number | null;
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
  discountPercent?: number;
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
  productType?: ProductType;
  /** Product-wide discount (0-100); omitted/0 = none. */
  discountPercent?: number;
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
  /** MEN and WOMEN also match UNISEX products. */
  type?: ProductType;
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
  "type" | "brandId" | "subCategoryId" | "minPrice" | "maxPrice" | "minRating"
>;
