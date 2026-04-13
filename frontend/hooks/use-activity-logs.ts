"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activityLogApi,
  type CreateActivityLogBody,
  type UpdateActivityLogBody,
  type SignBody,
} from "@/lib/api/trace";

export function useActivityLogsByBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ["activity-logs", "batch", batchId],
    queryFn: () => activityLogApi.listByBatch(batchId!),
    enabled: !!batchId,
  });
}

export function useCreateActivityLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, body }: { batchId: string; body: CreateActivityLogBody }) =>
      activityLogApi.create(batchId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["activity-logs", "batch", vars.batchId] });
    },
  });
}

export function useUpdateActivityLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateActivityLogBody }) =>
      activityLogApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useDeleteActivityLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activityLogApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useSignActivityLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SignBody }) =>
      activityLogApi.sign(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}
