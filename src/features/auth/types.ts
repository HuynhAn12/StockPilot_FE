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

export interface AuthStore {
  id: number;
  name: string;
  code: string;
  phone?: string | null;
  address?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  store?: AuthStore | null;
  tokens?: AuthTokens;
}
