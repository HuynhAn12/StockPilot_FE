import { useMutation } from "@tanstack/react-query";

import { onboardingApi } from "../api/onboardingApi";
import type { RegisterOwnerInput } from "../schemas/onboardingSchemas";

export function useRegisterOwner() {
  return useMutation({
    mutationFn: (data: RegisterOwnerInput) => onboardingApi.registerOwner(data),
  });
}
