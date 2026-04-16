"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keyApi } from "@/lib/api/key";

export function useUserKeys() {
  return useQuery({
    queryKey: ["user-keys"],
    queryFn: () => keyApi.list(),
  });
}

export function useGenerateKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => keyApi.generate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-keys"] });
    },
  });
}

export function useRevokeKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => keyApi.revoke(keyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-keys"] });
    },
  });
}
