export interface Role {
  active: boolean;
  description: string | null;
  roleId: number;
  roleName: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string | null;
  profileImage: string | null;
  active: boolean;
  addresses: Address[];
  role: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressPayload {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserAdminPayload {
  email?: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  profilePicture?: string;
  address?: AddressPayload;
  roles?: number[];
}

/** PUT /users/{id}: every field optional; omitted fields stay unchanged. Passwords go through PATCH /users/{id}/password. */
export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  /** "" clears the picture. */
  profilePicture?: string;
}

export interface UserQuery {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
  role?: string;
  active?: boolean;
}
