import { apiFetch } from "./client";
import type { Pagination } from "./product";
import type { BeUser } from "@/stores/auth-store";

export interface UserListResponse {
  items: BeUser[];
  pagination: Pagination;
}

export interface CreateUserBody {
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  role: string;
}

export interface UpdateUserBody {
  full_name?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export interface UserListParams {
  role?: string;
  page?: number;
  limit?: number;
}

function qs(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const userApi = {
  list: (params: UserListParams = {}) =>
    apiFetch<UserListResponse>(`/users${qs(params)}`),

  getById: (id: string) => apiFetch<BeUser>(`/users/${id}`),

  create: (body: CreateUserBody) =>
    apiFetch<BeUser>("/users", { method: "POST", body }),

  update: (id: string, body: UpdateUserBody) =>
    apiFetch<BeUser>(`/users/${id}`, { method: "PATCH", body }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
};
