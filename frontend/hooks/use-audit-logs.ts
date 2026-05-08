"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  auditApi,
  type ListAuditParams,
  type ListAnchorsParams,
} from "@/lib/api/audit";

export function useAuditLogs(params: ListAuditParams = {}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditApi.list(params),
  });
}

export function useAuditLog(seqNo: string | undefined) {
  return useQuery({
    queryKey: ["audit-logs", "by-seq", seqNo],
    queryFn: () => auditApi.getBySeq(seqNo!),
    enabled: !!seqNo,
  });
}

export function useVerifyAuditLog(seqNo: string | undefined) {
  return useQuery({
    queryKey: ["audit-logs", "verify", seqNo],
    queryFn: () => auditApi.verify(seqNo!),
    enabled: !!seqNo,
    // Verify có gọi RPC blockchain → đôi khi chậm 5-10s.
    // Cache 30s để tránh re-verify mỗi lần focus tab.
    staleTime: 30_000,
  });
}

export function useAuditAnchors(params: ListAnchorsParams = {}) {
  return useQuery({
    queryKey: ["audit-anchors", params],
    queryFn: () => auditApi.listAnchors(params),
  });
}

export function useTriggerAnchor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auditApi.triggerAnchor(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
      qc.invalidateQueries({ queryKey: ["audit-anchors"] });
    },
  });
}
