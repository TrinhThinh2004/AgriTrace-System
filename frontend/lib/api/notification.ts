import { apiFetch } from "./client";
import type { Pagination } from "./product";

export type NotificationType =
  | "INSPECTION_CREATED"
  | "INSPECTION_RESULT"
  | "USER_ACCOUNT_UPDATE";

export interface BeNotification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link: string;
  data: string; // JSON-encoded string từ backend
  is_read: boolean;
  read_at: string;
  created_at: string;
}

export interface NotificationListResponse {
  items: BeNotification[];
  pagination: Pagination;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  only_unread?: boolean;
}

function qs(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

export const notificationApi = {
  list: (params: NotificationListParams = {}) =>
    apiFetch<NotificationListResponse>(`/notifications${qs(params)}`),

  unreadCount: () =>
    apiFetch<{ count: number }>(`/notifications/unread-count`),

  markAsRead: (id: string) =>
    apiFetch<BeNotification>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllAsRead: () =>
    apiFetch<{ affected: number }>(`/notifications/read-all`, {
      method: "PATCH",
    }),

  delete: (id: string) =>
    apiFetch<{ affected: number }>(`/notifications/${id}`, {
      method: "DELETE",
    }),
};
