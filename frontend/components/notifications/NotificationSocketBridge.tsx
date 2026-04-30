"use client";
import { useNotificationSocket } from "@/hooks/use-notification-socket";

/**
 * Mount 1 lần ở provider để giữ kết nối socket toàn cục cho user đang đăng nhập.
 * Render null — chỉ chạy side effect.
 */
export function NotificationSocketBridge() {
  useNotificationSocket();
  return null;
}
