import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "../api/authApi";
import { AUTH_STORAGE_KEYS } from "../constants";
import type { LoginInput } from "../schemas/authSchemas";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "currentUser"],
    queryFn: () => authApi.getMe(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginInput) => authApi.login(credentials),
    onSuccess: (response) => {
      const data = response?.data;
      if (data?.tokens?.accessToken) {
        localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
      }
      if (data?.tokens?.refreshToken) {
        localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
      }
      if (data?.user) {
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(data.user));
      }
      const storeObj = data?.store || data?.user?.store;
      if (storeObj) {
        localStorage.setItem("sp_store", JSON.stringify(storeObj));
        if (storeObj.name) {
          localStorage.setItem("sp_store_name", storeObj.name);
        }
        if (storeObj.code) {
          localStorage.setItem("sp_tenant_slug", storeObj.code);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN) || undefined;
      return authApi.logout(refreshToken);
    },
    onSettled: () => {
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      localStorage.removeItem("sp_tenant_slug");
      queryClient.clear();
    },
  });
}
