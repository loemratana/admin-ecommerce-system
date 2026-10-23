export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionPayload {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export type UpdatePermissionPayload = Partial<PermissionPayload>;

