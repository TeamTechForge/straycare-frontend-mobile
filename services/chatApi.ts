// services/chatApi.ts
// REST API wrapper for chat endpoints. Uses fetch() + Bearer token
// matching the existing pattern from notifications.tsx and home.tsx.

import { API_URL } from "../constants/Config";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const chatApi = {
  getConversations: async (token: string) => {
    const res = await fetch(`${API_URL}/chat/conversations`, {
      headers: headers(token),
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  getOrCreateConversation: async (
    token: string,
    participantId: string,
    conversationType?: string,
    relatedEntity?: { kind: string; item: string }
  ) => {
    const res = await fetch(`${API_URL}/chat/conversations`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ participantId, conversationType, relatedEntity }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create conversation");
    }
    return res.json();
  },

  getMessages: async (token: string, conversationId: string, before?: string) => {
    const query = before ? `?before=${before}&limit=30` : "?limit=30";
    const res = await fetch(`${API_URL}/chat/messages/${conversationId}${query}`, {
      headers: headers(token),
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  sendMessage: async (
    token: string,
    data: {
      conversationId: string;
      text?: string;
      type?: "text" | "image" | "location";
      imageUrl?: string;
      imagePublicId?: string;
      location?: { latitude: number; longitude: number; address?: string };
    }
  ) => {
    const res = await fetch(`${API_URL}/chat/messages`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  markAsRead: async (token: string, conversationId: string) => {
    const res = await fetch(`${API_URL}/chat/messages/${conversationId}/read`, {
      method: "PUT",
      headers: headers(token),
    });
    if (!res.ok) throw new Error("Failed to mark as read");
    return res.json();
  },
};
