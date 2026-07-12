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

    console.log(`[useChat] 🛜 Joining chat room: ${conversationId}, User: ${user?._id || "none"}, Socket ID: ${socket.id}`);
    socket.emit("join_chat", conversationId);

    return () => {
      console.log(`[useChat] 🛜 Leaving chat room: ${conversationId}, User: ${user?._id || "none"}`);
      socket.emit("leave_chat", conversationId);
    };
  }, [socket, conversationId, user?._id]);

  // Send typing indicator with auto-stop after 2 seconds of inactivity
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !conversationId || !user?._id) return;

      console.log(`[useChat] ⌨️ setTyping to ${isTyping}. User: ${user._id}, Room: ${conversationId}`);
      if (isTyping) {
        socket.emit("user:typing", { conversationId, userId: user._id });

        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Auto-stop typing after 2s of no input
        typingTimeoutRef.current = setTimeout(() => {
          console.log(`[useChat] ⌨️ Auto-stopped typing due to inactivity. User: ${user._id}`);
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
    console.log(`[useChat] 👁️ emitReadReceipt. User: ${user._id}, Room: ${conversationId}`);
    socket.emit("message:read", { conversationId, userId: user._id });
  }, [socket, conversationId, user?._id]);

  // Subscribe to new messages for this conversation
  const onNewMessage = useCallback(
    (callback: (data: { message: any; conversationId: string }) => void) => {
      if (!socket) return () => { };

      const handler = (data: { message: any; conversationId: string }) => {
        console.log(`[useChat] 📥 Socket event [message:new] received. Sender: ${data.message?.sender?._id || data.message?.sender}, Room: ${data.conversationId}, User: ${user?._id}`);
        callback(data);
      };

      socket.on("message:new", handler);
      return () => {
        socket.off("message:new", handler);
      };
    },
    [socket, user?._id]
  );

  // Subscribe to typing events
  const onTyping = useCallback(
    (callback: (data: { conversationId: string; userId: string }) => void) => {
      if (!socket) return () => { };

      const handler = (data: { conversationId: string; userId: string }) => {
        console.log(`[useChat] 📥 Socket event [typing] received. Sender: ${data.userId}, Room: ${data.conversationId}`);
        callback(data);
      };

      socket.on("typing", handler);
      return () => {
        socket.off("typing", handler);
      };
    },
    [socket]
  );

  const onStopTyping = useCallback(
    (callback: (data: { conversationId: string; userId: string }) => void) => {
      if (!socket) return () => { };

      const handler = (data: { conversationId: string; userId: string }) => {
        console.log(`[useChat] 📥 Socket event [stop-typing] received. Sender: ${data.userId}, Room: ${data.conversationId}`);
        callback(data);
      };

      socket.on("stop-typing", handler);
      return () => {
        socket.off("stop-typing", handler);
      };
    },
    [socket]
  );

  // Subscribe to read receipt acknowledgements
  const onReadAck = useCallback(
    (callback: (data: { conversationId: string; readBy: string }) => void) => {
      if (!socket) return () => { };

      const handler = (data: { conversationId: string; readBy: string }) => {
        console.log(`[useChat] 📥 Socket event [message:read-ack] received. ReadBy: ${data.readBy}, Room: ${data.conversationId}`);
        callback(data);
      };

      socket.on("message:read-ack", handler);
      return () => {
        socket.off("message:read-ack", handler);
      };
    },
    [socket]
  );

  const onDeleteMessage = useCallback(
    (callback: (data: { messageId: string; conversationId: string }) => void) => {
      if (!socket) return () => { };

      const handler = (data: { messageId: string; conversationId: string }) => {
        console.log(`[useChat] 📥 Socket event [message:delete] received. MessageId: ${data.messageId}, Room: ${data.conversationId}`);
        callback(data);
      };

      socket.on("message:delete", handler);
      return () => {
        socket.off("message:delete", handler);
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
    onDeleteMessage,
  };
}
