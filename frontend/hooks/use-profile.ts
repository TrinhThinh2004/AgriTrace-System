"use client";
import { useMutation } from "@tanstack/react-query";
import { authApi, type UpdateProfileBody } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (body: UpdateProfileBody) => {
      await authApi.updateProfile(body);
      const fresh = await authApi.profile();
      return fresh;
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}
