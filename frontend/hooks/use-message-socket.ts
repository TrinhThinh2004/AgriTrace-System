"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getMessageSocket,
  disconnectMessageSocket,
} from "@/lib/messageSocket";
import { useAuthStore } from "@/stores/auth-store";
import type { BeMessage } from "@/lib/api/messages";

/**
 * Kết nối WebSocket /messages:
 *  - `message:new` → invalidate cache messages của conversation đó + conversations list.
 *  - `conversation:updated` → refetch danh sách hội thoại (last_message + unread).
 *  - `messages:unread-count-updated` → refetch badge tổng số unread.
 */
export function useMessageSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      disconnectMessageSocket();
      return;
    }

    const socket = getMessageSocket(accessToken);

    const onNew = (msg: BeMessage) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "thread", msg.conversation_id],
      });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["messages", "unread-count"],
      });
    };

    const onConvUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    };

    const onUnreadUpdated = () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", "unread-count"],
      });
    };

    const onError = (e: { message?: string } | undefined) => {
      console.warn("[message-socket] error:", e?.message);
    };

    socket.on("message:new", onNew);
    socket.on("conversation:updated", onConvUpdated);
    socket.on("messages:unread-count-updated", onUnreadUpdated);
    socket.on("error", onError);

    return () => {
      socket.off("message:new", onNew);
      socket.off("conversation:updated", onConvUpdated);
      socket.off("messages:unread-count-updated", onUnreadUpdated);
      socket.off("error", onError);
    };
  }, [accessToken, queryClient]);
}
