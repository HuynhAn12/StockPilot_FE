import { httpClient } from "../../../services/api";
import type { ApiResponse } from "../../../types/common";
import type { AuthResponse } from "../../auth/types";
import type { RegisterOwnerInput } from "../schemas/onboardingSchemas";
import type { SlugCheckResult } from "../types";

export const onboardingApi = {
  checkSlug: (slug: string) =>
    httpClient.get<ApiResponse<SlugCheckResult>>("/onboarding/store-slugs/check", {
      params: { slug },
    }),

  registerOwner: (data: RegisterOwnerInput) =>
    httpClient.post<ApiResponse<AuthResponse>>("/auth/register", {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      storeName: data.storeName,
      storeCode: data.storeCode,
      address: data.address,
    }),
};
