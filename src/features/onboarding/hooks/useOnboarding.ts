import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AUTH_STORAGE_KEYS } from "../../auth/constants";
import { onboardingApi } from "../api/onboardingApi";
import type { RegisterOwnerInput } from "../schemas/onboardingSchemas";

export function useRegisterOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterOwnerInput) => onboardingApi.registerOwner(data),
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
      if (data?.user?.store?.code) {
        localStorage.setItem("sp_tenant_slug", data.user.store.code);
      }
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
