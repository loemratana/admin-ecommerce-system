export interface ProductSize {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
}

export interface ProductSizePayload {
  name: string;
  description: string;
}
