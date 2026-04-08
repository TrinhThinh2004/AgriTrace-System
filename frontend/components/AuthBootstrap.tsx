"use client";
import { useEffect } from "react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Chạy khi app mount:
 *  1. Gọi /auth/refresh (httpOnly cookie tự gửi kèm) → nếu còn session hợp lệ thì có access_token mới
 *  2. Gọi /auth/profile để lấy user đầy đủ → setAuth(token, user)
 *  3. Nếu refresh fail (chưa login hoặc cookie hết hạn) → clearAuth
 *  4. Luôn setHydrated(true) để layout guards biết bootstrap đã xong
 *
 * Component này render null, chỉ chạy side effect.
 */
export function AuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { access_token } = await authApi.refresh();
        // setAccessToken trước để request profile có Bearer
        useAuthStore.getState().setAccessToken(access_token);
        const user = await authApi.profile();
        if (!cancelled) setAuth(access_token, user);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth, setHydrated]);

  return null;
}
