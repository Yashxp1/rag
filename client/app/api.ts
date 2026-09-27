import { ApiCallLog } from "./types";

export const DEFAULT_SERVER_URL = "http://localhost:4001";

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  isFormData?: boolean;
}

export async function executeApiCall(
  baseUrl: string,
  endpoint: string,
  options: RequestOptions = {},
  onLog?: (log: ApiCallLog) => void
): Promise<{ status: number; data: unknown; durationMs: number; ok: boolean }> {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${cleanBase}${cleanEndpoint}`;
  const method = options.method || "GET";

  const startTime = performance.now();
  let status = 0;
  let responseData: unknown = null;
  let isError = false;

  try {
    const fetchOptions: RequestInit = {
      method,
    };

    if (options.isFormData) {
      fetchOptions.body = options.body as FormData;
    } else if (options.body !== undefined) {
      fetchOptions.headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      fetchOptions.body = JSON.stringify(options.body);
    } else if (options.headers) {
      fetchOptions.headers = options.headers;
    }

    const res = await fetch(fullUrl, fetchOptions);
    status = res.status;

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseData = await res.json();
    } else {
      responseData = await res.text();
    }

    isError = !res.ok;
  } catch (err: unknown) {
    status = 0;
    isError = true;
    responseData = {
      success: false,
      error: err instanceof Error ? err.message : "Network error / Failed to fetch",
      hint: "Make sure the RAG server is running and reachable at " + fullUrl,
    };
  }

  const durationMs = Math.round(performance.now() - startTime);

  const logEntry: ApiCallLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    method,
    endpoint: cleanEndpoint,
    status,
    durationMs,
    requestPayload: options.isFormData ? "[FormData with file]" : options.body,
    responseData,
    isError,
  };

  if (onLog) {
    onLog(logEntry);
  }

  return {
    status,
    data: responseData,
    durationMs,
    ok: !isError,
  };
}
