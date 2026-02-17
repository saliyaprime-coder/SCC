import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

/**
 * Initialize socket connection
 */
export const initSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        userId
      }
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      // Join user's personal room
      if (userId) {
        socket.emit("join-room", userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a group room
 */
export const joinGroup = (groupId) => {
  if (socket) {
    socket.emit("join-group", groupId);
  }
};

/**
 * Leave a group room
 */
export const leaveGroup = (groupId) => {
  if (socket) {
    socket.emit("leave-group", groupId);
  }
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinGroup,
  leaveGroup
};
