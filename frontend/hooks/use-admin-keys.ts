"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeyApi, type AdminKeyListParams } from "@/lib/api/key";

export function useAdminKeys(params?: AdminKeyListParams) {
  return useQuery({
    queryKey: ["admin-keys", params],
    queryFn: () => adminKeyApi.list(params),
  });
}

export function useAdminRevokeKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => adminKeyApi.revoke(keyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-keys"] });
    },
  });
}
