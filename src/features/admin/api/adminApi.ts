import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { AdminUserListItem, SystemHealthStatus } from "../types";

export const adminApi = {
  getHealth: () =>
    httpClient.get<SystemHealthStatus>("/health/ready"),

  getUsers: (params?: { page?: number; limit?: number }) =>
    httpClient.get<PaginatedResponse<AdminUserListItem>>("/users", { params }),
};
