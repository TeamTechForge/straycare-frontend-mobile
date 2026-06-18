// hooks/useChatApi.ts
// Custom hook wrapping the chat REST API with auth token from AuthContext.

import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { chatApi } from "../services/chatApi";

export function useChatApi() {
  const { token } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!token) throw new Error("Not authenticated");
    return chatApi.getConversations(token);
  }, [token]);

  const fetchMessages = useCallback(
    async (conversationId: string, before?: string) => {
      if (!token) throw new Error("Not authenticated");
      return chatApi.getMessages(token, conversationId, before);
    },
    [token]
  );

  const createConversation = useCallback(
    async (
      participantId: string,
      conversationType?: string,
      relatedEntity?: { kind: string; item: string }
    ) => {
      if (!token) throw new Error("Not authenticated");
      return chatApi.getOrCreateConversation(token, participantId, conversationType, relatedEntity);
    },
    [token]
  );

  const sendMessage = useCallback(
    async (data: {
      conversationId: string;
      text?: string;
      type?: "text" | "image" | "location";
      imageUrl?: string;
      imagePublicId?: string;
      location?: { latitude: number; longitude: number; address?: string };
    }) => {
      if (!token) throw new Error("Not authenticated");
      return chatApi.sendMessage(token, data);
    },
    [token]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!token) throw new Error("Not authenticated");
      return chatApi.markAsRead(token, conversationId);
    },
    [token]
  );

  return {
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
  };
}
