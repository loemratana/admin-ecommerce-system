import type { PaymentMethod } from "@/features/payments/types/payment.types";

// Mirrors the Spring DTOs in ecommerce-api/order/dto.
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderSummaryResponse {
  orderNumber: string;
  status: OrderStatus;
  /** Null until the customer starts paying. */
  paymentMethod: PaymentMethod | null;
  totalOrderPrice: number;
  customerName: string | null;
  customerEmail: string | null;
  itemCount: number;
  orderDate: string;
}

export interface OrderCustomerResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface ShippingAddressResponse {
  recipientName: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
}

export interface OrderItemResponse {
  id: number;
  productVariantId: number | null;
  productName: string;
  sku: string | null;
  color: string | null;
  sizeName: string | null;
  /** Image of the ordered color, captured at order time. */
  imageUrl: string | null;
  quantity: number;
  price: number;
  priceAfterDiscount: number | null;
  lineTotal: number;
}

export interface OrderCouponResponse {
  id: number;
  couponCode: string;
  discountAmount: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  /** Null until the customer starts paying. Cash on delivery skips PAID. */
  paymentMethod: PaymentMethod | null;
  customer: OrderCustomerResponse | null;
  shippingAddress: ShippingAddressResponse | null;
  subtotal: number;
  discountAmount: number;
  taxPrice: number;
  shippingPrice: number;
  totalOrderPrice: number;
  /** Given back through received returns. */
  refundedAmount: number;
  /** Starts the return period; null if not delivered. */
  deliveredAt: string | null;
  items: OrderItemResponse[];
  couponCodes: string[];
  coupons: OrderCouponResponse[];
  orderDate: string;
  updateDate: string;
}

export interface OrderStatsResponse {
  totalOrders: number;
  byStatus: Record<OrderStatus, number>;
  totalRevenue: number;
}

export interface OrderQuery {
  status?: OrderStatus;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}
