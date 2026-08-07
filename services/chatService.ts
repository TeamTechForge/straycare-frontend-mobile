// services/chatService.ts
// REST API wrapper for chat endpoints. Uses fetch() + Bearer token
// matching the existing pattern from notifications.tsx and home.tsx.

import { API_URL } from "../constants/config.constants";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const logRequest = (url: string, token: string | null, method: string = "GET") => {
  const tokenExists = !!token;
  const tokenLength = token ? token.length : 0;
  console.log(`[chat.service Debug] 🌐 Request URL: [${method}] ${url}`);
  console.log(`[chat.service Debug] 🔑 Token Exists: ${tokenExists}, Token Length: ${tokenLength}`);
};

const logResponse = (url: string, status: number) => {
  console.log(`[chat.service Debug] 📥 Response Status for [${url}]: ${status}`);
};

export const chatService = {
  getConversations: async (token: string) => {
    const url = `${API_URL}/chat/conversations`;
    logRequest(url, token);
    const res = await fetch(url, {
      headers: headers(token),
    });
    logResponse(url, res.status);
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  getOrCreateConversation: async (
    token: string,
    participantId: string,
    conversationType?: string,
    relatedEntity?: { kind: string; item: string }
  ) => {
    const url = `${API_URL}/chat/conversations`;
    logRequest(url, token, "POST");
    const res = await fetch(url, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ participantId, conversationType, relatedEntity }),
    });
    logResponse(url, res.status);
    if (!res.ok) {
      const error = (await res.json()) as { message?: string };
      throw new Error(error.message || "Failed to create conversation");
    }
    return res.json();
  },

  getMessages: async (token: string, conversationId: string, before?: string) => {
    const query = before ? `?before=${before}&limit=30` : "?limit=30";
    const url = `${API_URL}/chat/messages/${conversationId}${query}`;
    logRequest(url, token);
    const res = await fetch(url, {
      headers: headers(token),
    });
    logResponse(url, res.status);
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
    const url = `${API_URL}/chat/messages`;
    logRequest(url, token, "POST");
    const res = await fetch(url, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(data),
    });
    logResponse(url, res.status);
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  markAsRead: async (token: string, conversationId: string) => {
    const url = `${API_URL}/chat/messages/${conversationId}/read`;
    logRequest(url, token, "PUT");
    const res = await fetch(url, {
      method: "PUT",
      headers: headers(token),
    });
    logResponse(url, res.status);
    if (!res.ok) throw new Error("Failed to mark as read");
    return res.json();
  },

  searchUsers: async (token: string, query: string) => {
    const url = `${API_URL}/users/search?query=${encodeURIComponent(query)}`;
    logRequest(url, token);
    const res = await fetch(url, {
      headers: headers(token),
    });
    logResponse(url, res.status);
    if (!res.ok) throw new Error("Failed to search users");
    return res.json();
  },

  deleteConversation: async (token: string, conversationId: string) => {
    const url = `${API_URL}/chat/conversations/${conversationId}`;
    logRequest(url, token, "DELETE");
    const res = await fetch(url, {
      method: "DELETE",
      headers: headers(token),
    });
    logResponse(url, res.status);
    if (!res.ok) throw new Error("Failed to delete conversation");
    return res.json();
  },

  deleteMessage: async (token: string, messageId: string, type: "me" | "everyone") => {
    const url = `${API_URL}/chat/messages/${messageId}`;
    logRequest(url, token, "DELETE");
    const res = await fetch(url, {
      method: "DELETE",
      headers: headers(token),
      body: JSON.stringify({ type }),
    });
    logResponse(url, res.status);
    if (!res.ok) throw new Error("Failed to delete message");
    return res.json();
  },
};
