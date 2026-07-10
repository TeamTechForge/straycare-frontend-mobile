// hooks/useChatApi.ts
// Custom hook wrapping the chat REST API with auth token from AuthContext.

import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../services/chat.service";

export function useChatApi() {
  const { token, user } = useAuth();

  const fetchConversations = useCallback(async () => {
    console.log(`[useChatApi] 🔍 fetchConversations. User: ${user?._id || "none"}, Token Exists: ${!!token}`);
    if (!token) throw new Error("Not authenticated");
    return chatService.getConversations(token);
  }, [token, user?._id]);

  const fetchMessages = useCallback(
    async (conversationId: string, before?: string) => {
      console.log(`[useChatApi] 🔍 fetchMessages. User: ${user?._id || "none"}, ConversationId: ${conversationId}, Before: ${before || "none"}`);
      if (!token) throw new Error("Not authenticated");
      return chatService.getMessages(token, conversationId, before);
    },
    [token, user?._id]
  );

  const createConversation = useCallback(
    async (
      participantId: string,
      conversationType?: string,
      relatedEntity?: { kind: string; item: string }
    ) => {
      console.log(`[useChatApi] 🔍 createConversation. User: ${user?._id || "none"}, ParticipantId: ${participantId}`);
      if (!token) throw new Error("Not authenticated");
      return chatService.getOrCreateConversation(token, participantId, conversationType, relatedEntity);
    },
    [token, user?._id]
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
      console.log(`[useChatApi] ✉️ sendMessage. User: ${user?._id || "none"}, ConversationId: ${data.conversationId}`);
      if (!token) throw new Error("Not authenticated");
      return chatService.sendMessage(token, data);
    },
    [token, user?._id]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      console.log(`[useChatApi] 📖 markAsRead. User: ${user?._id || "none"}, ConversationId: ${conversationId}`);
      if (!token) throw new Error("Not authenticated");
      return chatService.markAsRead(token, conversationId);
    },
    [token, user?._id]
  );

  const searchUsers = useCallback(
    async (query: string) => {
      console.log(`[useChatApi] 🔍 searchUsers. User: ${user?._id || "none"}, Query: "${query}"`);
      if (!token) throw new Error("Not authenticated");
      return chatService.searchUsers(token, query);
    },
    [token, user?._id]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      console.log(`[useChatApi] 🗑️ deleteConversation. User: ${user?._id || "none"}, ConversationId: ${conversationId}`);
      if (!token) throw new Error("Not authenticated");
      return chatService.deleteConversation(token, conversationId);
    },
    [token, user?._id]
  );

  const deleteMessage = useCallback(
    async (messageId: string, type: "me" | "everyone") => {
      console.log(`[useChatApi] 🗑️ deleteMessage. User: ${user?._id || "none"}, MessageId: ${messageId}, Type: ${type}`);
      if (!token) throw new Error("Not authenticated");
      return chatService.deleteMessage(token, messageId, type);
    },
    [token, user?._id]
  );

  return {
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
    searchUsers,
    deleteConversation,
    deleteMessage,
  };
}
