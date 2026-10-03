import { httpClient } from "../../../services/api";
import type { ApiResponse } from "../../../types/common";
import type { LoginInput } from "../schemas/authSchemas";
import type { AuthResponse, AuthUser } from "../types";

export const authApi = {
  login: (data: LoginInput) =>
    httpClient.post<ApiResponse<AuthResponse>>("/auth/login", data),

  getMe: () =>
    httpClient.get<ApiResponse<AuthUser>>("/auth/me"),

  logout: (refreshToken?: string) =>
    httpClient.post<ApiResponse<{ success: boolean }>>("/auth/logout", { refreshToken }),
};
