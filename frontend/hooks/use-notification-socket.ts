"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotificationSocket,
  disconnectNotificationSocket,
} from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import type { BeNotification } from "@/lib/api/notification";

/**
 * Hook duy nhất kết nối WebSocket /notifications:
 *  - Lắng nghe `notification:new` → toast + invalidate React Query.
 *  - Lắng nghe `notification:unread-count-updated` → refetch badge.
 *  - Khi accessToken đổi (login/logout) → reconnect lại bằng token mới.
 */
export function useNotificationSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      disconnectNotificationSocket();
      return;
    }

    const socket = getNotificationSocket(accessToken);

    const onNew = (n: BeNotification) => {
      toast(n.title, { description: n.message });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const onUnreadUpdated = () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    };

    const onError = (e: { message?: string } | undefined) => {
      // Server reject (token sai/hết hạn) — log nhẹ, không spam toast.
      // Token refresh sẽ trigger remount qua effect này.
      console.warn("[notification-socket] error:", e?.message);
    };

    socket.on("notification:new", onNew);
    socket.on("notification:unread-count-updated", onUnreadUpdated);
    socket.on("error", onError);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("notification:unread-count-updated", onUnreadUpdated);
      socket.off("error", onError);
    };
  }, [accessToken, queryClient]);
}
