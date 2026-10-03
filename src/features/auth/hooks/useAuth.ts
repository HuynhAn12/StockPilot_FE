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
      if (response?.data?.tokens?.accessToken) {
        localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.data.tokens.accessToken);
      }
      if (response?.data?.tokens?.refreshToken) {
        localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.data.tokens.refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
