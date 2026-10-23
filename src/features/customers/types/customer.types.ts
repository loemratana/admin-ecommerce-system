// Mirrors the Spring DTOs in ecommerce-api/customer/dto.
import type { OrderStatus } from "@/features/orders/types/order.types";
import type { Address } from "@/features/users/types/user.types";

export interface CustomerSummaryResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  active: boolean;
  joinedAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export interface CustomerDetailResponse {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  active: boolean;
  joinedAt: string;
  updatedAt: string;
  addresses: Address[];
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  ordersByStatus: Record<OrderStatus, number>;
  reviewCount: number;
}

export interface CustomerStatsResponse {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newThisMonth: number;
  customersWithOrders: number;
}

export interface CustomerQuery {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
