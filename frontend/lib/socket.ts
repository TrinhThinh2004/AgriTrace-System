"use client";
import { io, type Socket } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

let socket: Socket | null = null;
let currentToken: string | null = null;

/**
 * Lấy socket cho namespace `/notifications`. Tạo mới nếu chưa có hoặc token đổi.
 *
 * - Token được gửi qua handshake auth (server đọc `client.handshake.auth.token`).
 * - Force `transports: ['websocket']` để có Network → WS frame thật trên DevTools
 *   (mặc định Socket.IO sẽ thử HTTP polling trước rồi upgrade).
 */
export function getNotificationSocket(token: string): Socket {
  if (socket && currentToken === token && socket.connected) {
    return socket;
  }

  // Token đổi (login lại / refresh) → tear down rồi tạo mới
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io(`${BASE_URL}/notifications`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectNotificationSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
