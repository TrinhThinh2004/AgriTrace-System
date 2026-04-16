import { apiFetch } from "./client";

export interface GenerateKeyPairResponse {
  key_id: string;
  public_key: string;
  private_key: string;
  algorithm: string;
}

export interface PublicKeyInfo {
  key_id: string;
  user_id: string;
  public_key: string;
  algorithm: string;
  is_active: boolean;
}

export interface ListUserKeysResponse {
  keys: PublicKeyInfo[];
}

// ── Admin Key Types ──────────────────────────────────────────────
export interface AdminKeyInfo {
  key_id: string;
  user_id: string;
  public_key: string;
  algorithm: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string;
  user_email: string;
  user_full_name: string;
  user_role: string;
}

export interface AdminKeyListResponse {
  items: AdminKeyInfo[];
  pagination: { page: number; limit: number; total: number };
}

export interface AdminKeyListParams {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: string;
}

function qs(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const adminKeyApi = {
  list: (params: AdminKeyListParams = {}) =>
    apiFetch<AdminKeyListResponse>(`/admin/keys${qs(params)}`),

  revoke: (keyId: string) =>
    apiFetch<{ message: string }>(`/admin/keys/${keyId}/revoke`, {
      method: "POST",
    }),
};

// ── User Key API ─────────────────────────────────────────────────
export const keyApi = {
  generate: () =>
    apiFetch<GenerateKeyPairResponse>("/users/me/keys/generate", {
      method: "POST",
    }),

  list: () =>
    apiFetch<ListUserKeysResponse>("/users/me/keys"),

  revoke: (keyId: string) =>
    apiFetch<{ message: string }>(`/users/me/keys/${keyId}/revoke`, {
      method: "POST",
    }),
};
