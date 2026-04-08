"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    // onSettled chạy dù success hay fail — luôn clear local state
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
