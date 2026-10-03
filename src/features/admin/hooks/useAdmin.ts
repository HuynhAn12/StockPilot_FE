import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api/adminApi";

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => adminApi.getHealth(),
    refetchInterval: 1000 * 30, // Poll every 30s
  });
}

export function useAdminUsers(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.getUsers(params),
  });
}
