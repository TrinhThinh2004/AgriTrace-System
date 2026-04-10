"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  batchApi,
  type BatchListParams,
  type CreateBatchBody,
  type UpdateBatchBody,
  type TransitionBatchBody,
} from "@/lib/api/product";

export function useBatches(params: BatchListParams = {}) {
  return useQuery({
    queryKey: ["batches", params],
    queryFn: () => batchApi.list(params),
  });
}

export function useBatch(id: string | undefined) {
  return useQuery({
    queryKey: ["batches", id],
    queryFn: () => batchApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBatchBody) => batchApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBatchBody }) =>
      batchApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}

export function useTransitionBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TransitionBatchBody }) =>
      batchApi.transition(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}
