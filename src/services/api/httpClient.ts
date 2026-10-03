import { ApiError, type ApiErrorResponse } from "./apiError";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, headers: customHeaders, ...customConfig } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = localStorage.getItem("sp_access_token");
  const headers = new Headers(customHeaders);

  if (!headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    body:
      body instanceof FormData
        ? body
        : body
        ? JSON.stringify(body)
        : undefined,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      const message =
        errorData?.error?.message ||
        errorData?.message ||
        response.statusText ||
        "Có lỗi xảy ra khi kết nối máy chủ";
      const code = errorData?.error?.code || "API_REQUEST_FAILED";
      const fieldErrors = errorData?.error?.fieldErrors;
      const requestId = errorData?.error?.requestId;

      throw new ApiError(message, response.status, code, fieldErrors, requestId);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng",
      0,
      "NETWORK_ERROR"
    );
  }
}

export const httpClient = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "POST", body }),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PUT", body }),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PATCH", body }),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "DELETE" }),
};
