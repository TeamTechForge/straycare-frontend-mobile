// hooks/useChat.ts
// Custom hook wrapping Socket.IO chat events for real-time messaging.

import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";

export function useChat(conversationId?: string) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Join/leave conversation room when conversationId changes
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join_chat", conversationId);

    return () => {
      socket.emit("leave_chat", conversationId);
    };
  }, [socket, conversationId]);

  // Send typing indicator with auto-stop after 2 seconds of inactivity
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !conversationId || !user?._id) return;

      if (isTyping) {
        socket.emit("user:typing", { conversationId, userId: user._id });

        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Auto-stop typing after 2s of no input
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("user:stop-typing", { conversationId, userId: user._id });
        }, 2000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit("user:stop-typing", { conversationId, userId: user._id });
      }
    },
    [socket, conversationId, user?._id]
  );

  // Emit read receipt
  const emitReadReceipt = useCallback(() => {
    if (!socket || !conversationId || !user?._id) return;
    socket.emit("message:read", { conversationId, userId: user._id });
  }, [socket, conversationId, user?._id]);

  // Subscribe to new messages for this conversation
  const onNewMessage = useCallback(
    (callback: (data: { message: any; conversationId: string }) => void) => {
      if (!socket) return () => {};

      socket.on("message:new", callback);
      return () => {
        socket.off("message:new", callback);
      };
    },
    [socket]
  );

  // Subscribe to typing events
  const onTyping = useCallback(
    (callback: (data: { conversationId: string; userId: string }) => void) => {
      if (!socket) return () => {};

      socket.on("typing", callback);
      return () => {
        socket.off("typing", callback);
      };
    },
    [socket]
  );

  const onStopTyping = useCallback(
    (callback: (data: { conversationId: string; userId: string }) => void) => {
      if (!socket) return () => {};

      socket.on("stop-typing", callback);
      return () => {
        socket.off("stop-typing", callback);
      };
    },
    [socket]
  );

  // Subscribe to read receipt acknowledgements
  const onReadAck = useCallback(
    (callback: (data: { conversationId: string; readBy: string }) => void) => {
      if (!socket) return () => {};

      socket.on("message:read-ack", callback);
      return () => {
        socket.off("message:read-ack", callback);
      };
    },
    [socket]
  );

  return {
    setTyping,
    emitReadReceipt,
    onNewMessage,
    onTyping,
    onStopTyping,
    onReadAck,
  };
}
