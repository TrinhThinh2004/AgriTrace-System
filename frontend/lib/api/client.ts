import { useAuthStore } from "@/stores/auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ;
// console.log(`API base URL: ${BASE_URL}`);
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Nếu true, skip auto refresh khi 401 (dùng cho chính các auth endpoint). */
  skipAuthRefresh?: boolean;
  /** Internal: đánh dấu request đã retry sau refresh rồi. */
  _retried?: boolean;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  let code: string | undefined;
  try {
    const data = await res.json();
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    }
    if (data?.error) code = data.error;
  } catch {
    // body không phải JSON — bỏ qua
  }
  return new ApiError(message, res.status, code);
}

let refreshPromise: Promise<string> | null = null;

/**
 * Gọi /auth/refresh để lấy access token mới từ httpOnly cookie.
 * De-dupe: nếu đã có request refresh đang chạy, các caller khác cùng chờ promise đó.
 */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw await parseError(res);
      const data = (await res.json()) as { access_token: string };
      useAuthStore.getState().setAccessToken(data.access_token);
      return data.access_token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, skipAuthRefresh, _retried, headers, ...rest } = options;

  const accessToken = useAuthStore.getState().accessToken;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  // Auto refresh on 401 (1 lần)
  if (res.status === 401 && !skipAuthRefresh && !_retried) {
    try {
      await refreshAccessToken();
    } catch {
      useAuthStore.getState().clearAuth();
      throw await parseError(res);
    }
    return apiFetch<T>(path, { ...options, _retried: true });
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}
