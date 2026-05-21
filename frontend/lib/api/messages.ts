import { apiFetch } from "./client";
import type { Pagination } from "./product";
import type { BeUser } from "@/stores/auth-store";

export interface BeConversation {
  id: string;
  other_user: BeUser;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

export interface BeMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string;
  created_at: string;
}

export interface ConversationListResponse {
  items: BeConversation[];
}

export interface MessageListResponse {
  items: BeMessage[];
  pagination: Pagination;
}

export interface ContactItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string;
}

export interface ContactListResponse {
  items: ContactItem[];
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

export const messagesApi = {
  listConversations: () =>
    apiFetch<ConversationListResponse>(`/messages/conversations`),

  getOrCreateConversation: (otherUserId: string) =>
    apiFetch<BeConversation>(`/messages/conversations`, {
      method: "POST",
      body: { other_user_id: otherUserId },
    }),

  listMessages: (
    conversationId: string,
    params: { page?: number; limit?: number } = {},
  ) =>
    apiFetch<MessageListResponse>(
      `/messages/conversations/${conversationId}/messages${qs(params)}`,
    ),

  sendMessage: (conversationId: string, content: string) =>
    apiFetch<BeMessage>(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { content },
    }),

  markRead: (conversationId: string) =>
    apiFetch<{ affected: number }>(
      `/messages/conversations/${conversationId}/read`,
      { method: "PATCH" },
    ),

  totalUnread: () => apiFetch<{ count: number }>(`/messages/unread-count`),

  listContacts: (search?: string) =>
    apiFetch<ContactListResponse>(
      `/messages/contacts${search ? qs({ search }) : ""}`,
    ),
};
