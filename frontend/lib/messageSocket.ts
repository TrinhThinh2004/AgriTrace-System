"use client";
import { io, type Socket } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

let socket: Socket | null = null;
let currentToken: string | null = null;

/**
 * Socket cho namespace `/messages`. Mirror getNotificationSocket nhưng tách instance
 * riêng để không trộn 2 channel events.
 */
export function getMessageSocket(token: string): Socket {
  if (socket && currentToken === token && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io(`${BASE_URL}/messages`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectMessageSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
