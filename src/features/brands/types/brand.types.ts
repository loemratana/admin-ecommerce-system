export interface BrandProduct {
  id: number;
  name: string;
  slug: string;
  price: number | null;
  imageUrl: string | null;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  products?: BrandProduct[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandPayload {
  name: string;
  slug: string;
  image: string;
}
