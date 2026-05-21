"use client";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/stores/auth-store";

export function useConversations() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => messagesApi.listConversations(),
    enabled: !!accessToken,
  });
}

export function useTotalUnreadMessages() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => messagesApi.totalUnread(),
    enabled: !!accessToken,
    staleTime: 10_000,
  });
}

export function useMessages(conversationId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["messages", "thread", conversationId],
    queryFn: () => messagesApi.listMessages(conversationId!, { limit: 50 }),
    enabled: !!accessToken && !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      messagesApi.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "thread", conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      messagesApi.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["messages", "unread-count"],
      });
    },
  });
}

export function useContacts(search?: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["messages", "contacts", search ?? ""],
    queryFn: () => messagesApi.listContacts(search),
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) =>
      messagesApi.getOrCreateConversation(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
    },
  });
}
