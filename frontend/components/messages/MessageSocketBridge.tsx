"use client";
import { useMessageSocket } from "@/hooks/use-message-socket";

/**
 * Mount 1 lần ở provider để giữ kết nối socket /messages toàn cục.
 * Đảm bảo cả badge unread trên sidebar được cập nhật khi user không ở trang chat.
 */
export function MessageSocketBridge() {
  useMessageSocket();
  return null;
}
