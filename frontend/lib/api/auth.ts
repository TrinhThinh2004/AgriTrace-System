import { apiFetch } from "./client";
import type { BeUser } from "@/stores/auth-store";

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: BeUser;
}

export interface UpdateProfileBody {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  bio?: string;
}

export const authApi = {
  login: (body: LoginBody) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body,
      skipAuthRefresh: true,
    }),

  register: (body: RegisterBody) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body,
      skipAuthRefresh: true,
    }),

  /** Gọi trực tiếp endpoint; nếu fail nghĩa là chưa có session hợp lệ. */
  refresh: () =>
    apiFetch<{ access_token: string }>("/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    }),

  logout: () =>
    apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  profile: () => apiFetch<BeUser>("/auth/profile"),

  updateProfile: (body: UpdateProfileBody) =>
    apiFetch<BeUser>("/auth/profile", {
      method: "PATCH",
      body,
    }),
};
