export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: "SHOP_OWNER" | "WAREHOUSE_STAFF" | "ADMIN";
  isActive: boolean;
  storeId?: number | null;
  store?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens?: AuthTokens;
}
