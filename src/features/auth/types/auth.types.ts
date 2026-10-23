export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  deviceName: string;
  deviceType: "WEB";
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface Device {
  id: number;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
  active: boolean;
}
