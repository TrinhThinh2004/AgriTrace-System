import { create } from "zustand";

export interface BeUser {
  id: string;
  email: string;
  full_name: string;
  role: string; // BE trả uppercase: "ADMIN" | "FARMER" | "INSPECTOR" | "PUBLIC"
  status?: string;
  phone?: string;
  created_at?: string;
  avatar_url?: string;
  address?: string;
  bio?: string;
}

interface AuthState {
  accessToken: string | null;
  user: BeUser | null;
  hydrated: boolean;
  setAuth: (token: string, user: BeUser) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: BeUser | null) => void;
  clearAuth: () => void;
  setHydrated: (v: boolean) => void;
}

/**
 * Auth store (Zustand).
 *
 * - `accessToken` chỉ lưu trong memory → chống XSS leak. Khi reload trang sẽ mất,
 *   component `AuthBootstrap` sẽ gọi /auth/refresh để khôi phục từ httpOnly cookie.
 * - `user` đi kèm access token, được set trong cùng `setAuth`.
 * - `hydrated` đánh dấu bootstrap đã xong → layout guard biết lúc nào được phép redirect.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setAuth: (token, user) => set({ accessToken: token, user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  setHydrated: (v) => set({ hydrated: v }),
}));
