// contexts/SocketContext.tsx
// Manages the Socket.IO connection to the /chat namespace.
// Auto-connects when user is authenticated, disconnects on logout.

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../constants/config.constants";
import { useAuth } from "./AuthContext";
import { chatService } from "../services/ChatService";
import { CallLogService } from "../services/CallLogService";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  hasUnreadChats: boolean;
  hasUnseenMissedCalls: boolean;
  refreshChatBadge: () => Promise<void>;
  refreshCallBadge: () => Promise<void>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  hasUnreadChats: false,
  hasUnseenMissedCalls: false,
  refreshChatBadge: async () => {},
  refreshCallBadge: async () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  const [hasUnseenMissedCalls, setHasUnseenMissedCalls] = useState(false);

  const refreshChatBadge = async () => {
    if (!token || !user?._id) return;
    try {
      const conversations = (await chatService.getConversations(token)) as any[];
      const hasUnread = conversations.some((c: any) => c.unreadCounts?.[user._id] > 0);
      console.log(`[SocketContext] refreshChatBadge: hasUnread=${hasUnread}`);
      setHasUnreadChats(hasUnread);
    } catch (error) {
      console.error("[SocketContext] Error refreshing chat badge", error);
    }
  };

  const refreshCallBadge = async () => {
    if (!token || !user?._id) return;
    try {
      const history = (await CallLogService.getHistory()) as any[];
      const hasUnseen = history.some((l: any) => {
        const isMissed = l.status === "MISSED";
        const notSeen = !l.isSeen;
        const isReceiver = l.receiver.userId === user._id;
        if (isMissed && notSeen && isReceiver) {
           console.log(`[SocketContext] Found unseen missed call: ${l._id}`);
        }
        return isMissed && notSeen && isReceiver;
      });
      console.log(`[SocketContext] refreshCallBadge: hasUnseenMissedCalls=${hasUnseen}`);
      setHasUnseenMissedCalls(hasUnseen);
    } catch (error) {
      console.error("[SocketContext] Error refreshing call badge", error);
    }
  };

  useEffect(() => {
    // Only connect when we have an authenticated user
    if (!user?._id || !token) {
      // Disconnect any existing socket if user logs out
      if (socketRef.current) {
        console.log("[SocketContext] Disconnecting — user logged out or token missing");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    console.log(`[SocketContext] Connecting to ${BASE_URL}/chat for user ${user._id}`);

    // Create socket connection to /chat namespace
    const socket = io(`${BASE_URL}/chat`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[SocketContext] ✅ Connected to /chat namespace. Socket ID: ${socket.id}, User: ${user._id}`);
      setIsConnected(true);

      // Announce this user is online
      socket.emit("user:join", { userId: user._id });

      // Fetch initial badges
      refreshChatBadge();
      refreshCallBadge();
    });

    socket.on("disconnect", (reason) => {
      console.log(`[SocketContext] ❌ Disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn(`[SocketContext] Connection error: ${err.message}`);
    });

    socket.on("reconnect", (attemptNumber: number) => {
      console.log(`[SocketContext] Reconnected after ${attemptNumber} attempts`);
      // Re-announce user on reconnection
      socket.emit("user:join", { userId: user._id });
    });

    // ── Online Users Sync ──────────────────────────────────
    // Receive the full list of online users when we first join.
    // This ensures we know who is already online, not just future joins.
    socket.on("users:online-list", ({ users }: { users: string[] }) => {
      console.log(`[SocketContext] Received online users list: ${users.length} users`);
      setOnlineUsers(new Set(users));
    });

    // Track individual online/offline events after initial sync
    socket.on("user:online", ({ userId }: { userId: string }) => {
      console.log(`[SocketContext] User came online: ${userId}`);
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    socket.on("user:offline", ({ userId }: { userId: string }) => {
      console.log(`[SocketContext] User went offline: ${userId}`);
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // ── Badges Sync ─────────────────────────────────────────
    socket.on("message:new", refreshChatBadge);
    socket.on("message:read-ack", refreshChatBadge);
    
    // In straycare we emit 'call:ended' over the /call namespace, not /chat namespace.
    // However, if we need to cross-communicate, we might just poll or wait for the user to open the history.
    // Wait, since call is on /call namespace, listening here won't catch call:ended natively.
    // Instead, the CallContext will trigger the refresh. We can expose it in context.

    return () => {
      console.log("[SocketContext] Cleaning up socket connection");
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?._id, token]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        hasUnreadChats,
        hasUnseenMissedCalls,
        refreshChatBadge,
        refreshCallBadge,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
