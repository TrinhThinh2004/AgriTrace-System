import { apiFetch } from "./client";

export interface AiSuggestion {
  content: string;
  model: string;
  tokens_used: number;
  latency_ms: number;
}

export interface SuggestBatchPlantingBody {
  farm_id?: string;
  crop_category_id?: string;
  season_hint?: string;
}

export interface SuggestActivityLogBody {
  batch_id: string;
  activity_type: string;
}

export interface SuggestInspectionBody {
  batch_id: string;
}

export const aiApi = {
  suggestBatchPlanting: (body: SuggestBatchPlantingBody) =>
    apiFetch<AiSuggestion>("/ai/suggest/batch-planting", {
      method: "POST",
      body,
    }),

  suggestActivityLog: (body: SuggestActivityLogBody) =>
    apiFetch<AiSuggestion>("/ai/suggest/activity-log", {
      method: "POST",
      body,
    }),

  suggestInspectionSummary: (body: SuggestInspectionBody) =>
    apiFetch<AiSuggestion>("/ai/suggest/inspection-summary", {
      method: "POST",
      body,
    }),
};
