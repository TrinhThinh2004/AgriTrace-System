"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  aiApi,
  type SuggestActivityLogBody,
  type SuggestBatchPlantingBody,
  type SuggestInspectionBody,
} from "@/lib/api/ai";
import { ApiError } from "@/lib/api/client";

function aiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Đã vượt giới hạn AI, thử lại sau 1 phút.";
    if (err.status === 401)
      return "Chưa cấu hình GEMINI_API_KEY trên server.";
    return err.message;
  }
  return "Không gọi được AI. Kiểm tra mạng và backend.";
}

export function useSuggestBatchPlanting() {
  return useMutation({
    mutationFn: (body: SuggestBatchPlantingBody) =>
      aiApi.suggestBatchPlanting(body),
    onError: (err) => toast.error(aiError(err)),
  });
}

export function useSuggestActivityLog() {
  return useMutation({
    mutationFn: (body: SuggestActivityLogBody) => aiApi.suggestActivityLog(body),
    onError: (err) => toast.error(aiError(err)),
  });
}

export function useSuggestInspectionSummary() {
  return useMutation({
    mutationFn: (body: SuggestInspectionBody) =>
      aiApi.suggestInspectionSummary(body),
    onError: (err) => toast.error(aiError(err)),
  });
}
