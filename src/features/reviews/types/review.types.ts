export interface ReviewAuthor {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string;
}

// The review API currently fills only id, slug and imageUrl; name and price come back null.
export interface ReviewProductSummary {
  id: number;
  name: string | null;
  slug: string | null;
  price: number | null;
  imageUrl: string | null;
}

export interface ProductReview {
  id: number;
  title: string;
  ratings: number;
  comment: string;
  user: ReviewAuthor;
  product: ReviewProductSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPayload {
  title: string;
  ratings: number;
  comment: string;
}

export interface ReviewPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ReviewQuery {
  page?: number;
  size?: number;
}
