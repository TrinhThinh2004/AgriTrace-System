"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  farmApi,
  type ListParams,
  type CreateFarmBody,
  type UpdateFarmBody,
} from "@/lib/api/product";

export function useFarms(params: ListParams = {}) {
  return useQuery({
    queryKey: ["farms", params],
    queryFn: () => farmApi.list(params),
  });
}

export function useFarm(id: string | undefined) {
  return useQuery({
    queryKey: ["farms", id],
    queryFn: () => farmApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFarmBody) => farmApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFarmBody }) =>
      farmApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}

export function useDeleteFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
}
