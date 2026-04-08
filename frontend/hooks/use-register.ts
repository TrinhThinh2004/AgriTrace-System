"use client";
import { useMutation } from "@tanstack/react-query";
import { authApi, type RegisterBody } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (body: RegisterBody) => authApi.register(body),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user);
    },
  });
}
