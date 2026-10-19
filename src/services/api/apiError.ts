export interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
      error?: {
        message?: string;
      };
    };
    status?: number;
  };
}
