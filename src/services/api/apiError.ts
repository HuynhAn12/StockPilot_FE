export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;

  constructor(
    message: string,
    statusCode = 500,
    code = "UNKNOWN_ERROR",
    fieldErrors?: Record<string, string[]>,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}
