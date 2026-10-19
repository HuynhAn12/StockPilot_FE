export interface PaginatedResponse<T> {
  success?: boolean;
  data?: T[];
  items?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}
