import { Platform } from "react-native";

import type { ForumPost, ForumThread, ForumThreadComment, ForumThreadResponse } from "../types/Forum";

const CLIENT_USER_ID = "forum-guest";

// ─── URL Resolution ──────────────────────────────────────────────
// Priority order:
//   1. EXPO_PUBLIC_API_URL env var  ← set this to your PC's LAN IP for physical devices
//   2. Platform-specific fallback   ← for emulators/simulators only
//
// Emulator fallbacks (NOT for real phones):
//   Android Emulator : http://10.0.2.2:5000   (routes to host machine)
//   iOS Simulator    : http://localhost:5000   (shares host network)
//   Web              : http://localhost:5000
//
// Physical Device (iOS or Android):
//   Set EXPO_PUBLIC_API_URL=http://<your-pc-lan-ip>:5000 in frontend-mobile/.env
//   Find your LAN IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
//
const getApiBaseUrl = (): string => {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  console.log(`[forum.service] Platform: ${Platform.OS}`);
  console.log(`[forum.service] EXPO_PUBLIC_API_URL env: ${explicitUrl || "(not set)"}`);

  if (explicitUrl) {
    const cleanUrl = explicitUrl.replace(/\/$/, "");
    console.log(`[forum.service] Using EXPO_PUBLIC_API_URL: ${cleanUrl}`);
    return cleanUrl;
  }

  // Fallback defaults — only reliable on emulators/simulators
  let baseUrl: string;
  if (Platform.OS === "android") {
    baseUrl = "http://10.0.2.2:5000"; // Android emulator → host machine
  } else {
    baseUrl = "http://localhost:5000"; // iOS simulator / web
  }

  console.log(`[forum.service] Using platform default URL: ${baseUrl}`);
  console.warn(
    `[forum.service] WARNING: Using default URL "${baseUrl}". ` +
    `If on a physical device, set EXPO_PUBLIC_API_URL in frontend-mobile/.env`
  );
  return baseUrl;
};

const buildUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${path}`;
  console.log(`[forum.service] Built URL: ${fullUrl}`);
  return fullUrl;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const url = buildUrl(path);
  const method = init?.method || "GET";
  
  console.log(`[forum.service] ========== REQUEST START ==========`);
  console.log(`[forum.service] Method: ${method}`);
  console.log(`[forum.service] URL: ${url}`);
  if (init?.body) {
    console.log(`[forum.service] Body: ${String(init.body).substring(0, 200)}`);
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch (networkError) {
    console.error(`[forum.service] NETWORK ERROR:`, networkError);
    throw new Error(`Network error calling ${url}: ${String(networkError)}`);
  }

  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "(no content-type)";
  
  console.log(`[forum.service] Response Status: ${response.status}`);
  console.log(`[forum.service] Response Content-Type: ${contentType}`);
  console.log(`[forum.service] Response Body (first 500 chars): ${rawText.substring(0, 500)}`);

  let body: unknown = null;
  if (rawText && rawText.trim()) {
    try {
      body = JSON.parse(rawText);
      console.log(`[forum.service] JSON parsed successfully`);
    } catch (parseError) {
      console.error(`[forum.service] JSON PARSE ERROR`, parseError);
      console.error(`[forum.service] Raw response was:`, rawText);
      
      // If HTML, show first 100 chars to identify what page it is
      if (rawText.includes("<html") || rawText.includes("<!DOCTYPE")) {
        console.error(`[forum.service] ERROR: Received HTML! First 200 chars: ${rawText.substring(0, 200)}`);
      }
      
      throw new Error(`Expected JSON from ${url} but received non-JSON response. Status ${response.status}. Content-Type: ${contentType}`);
    }
  }

  console.log(`[forum.service] Response OK: ${response.ok}`);
  
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: unknown }).message)
        : `Request failed with status ${response.status}`;
    console.error(`[forum.service] Request failed: ${message}`);
    throw new Error(message);
  }

  console.log(`[forum.service] ========== REQUEST END (SUCCESS) ==========`);
  return body as T;
};

const mapThread = (response: ForumThreadResponse): ForumThread => ({
  rescueId: response.rescueId,
  comments: (response.comments || []).map((comment: ForumThreadComment) => ({
    id: comment.id,
    userId: comment.userId,
    text: comment.text,
    timestamp: comment.timestamp,
  })),
});

export async function getAllPosts(): Promise<ForumPost[]> {
  return requestJson<ForumPost[]>(`/api/forum?userId=${encodeURIComponent(CLIENT_USER_ID)}`);
}

export async function createPost(data: { title: string; tag?: ForumPost["tag"]; author?: string; imageUrl?: string }) {
  return requestJson<{ message: string; post: ForumPost }>("/api/forum", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      tag: data.tag ?? "GENERAL",
      author: data.author ?? "You",
      imageUrl: data.imageUrl ?? "",
    }),
  });
}

export async function getThread(rescueId: string): Promise<ForumThread> {
  const thread = await requestJson<ForumThreadResponse>(`/api/forum/${encodeURIComponent(rescueId)}`);
  return mapThread(thread);
}

export async function addComment(rescueId: string, text: string): Promise<ForumThread> {
  const response = await requestJson<{ message: string; thread: ForumThreadResponse }>(
    `/api/forum/${encodeURIComponent(rescueId)}/comment`,
    {
      method: "POST",
      body: JSON.stringify({ text, userId: CLIENT_USER_ID }),
    }
  );

  return mapThread(response.thread);
}

export async function likePost(postId: string) {
  return requestJson<{ message: string; post: ForumPost; likedByMe: boolean }>(
    `/api/forum/${encodeURIComponent(postId)}/like`,
    {
      method: "POST",
      body: JSON.stringify({ userId: CLIENT_USER_ID }),
    }
  );
}