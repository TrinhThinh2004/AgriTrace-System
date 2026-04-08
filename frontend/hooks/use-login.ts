"use client";
import { useMutation } from "@tanstack/react-query";
import { authApi, type LoginBody } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (body: LoginBody) => authApi.login(body),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user);
    },
  });
}
