import { Platform } from "react-native";

import type { LiveTrackingResponse, RescueByIdResponse, RescueCaseRecord, RescueComment } from "../types/Api";

import { BASE_URL } from "../constants/config.constants";

const getApiBaseUrls = (): string[] => [BASE_URL];

/**
 * Returns the primary API base URL for building image/upload URLs.
 * Components use this to prefix relative photo paths like /uploads/photo.jpg
 */
export const getApiBaseUrl = (): string => BASE_URL;

const buildUrl = (baseUrl: string, path: string) => `${baseUrl}${path}`;

const requestJson = async <T>(path: string): Promise<T> => {
  let lastError: unknown = null;

  for (const baseUrl of getApiBaseUrls()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(buildUrl(baseUrl, path), {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      const body = text ? (JSON.parse(text) as T) : (null as T);

      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "message" in body
            ? String((body as { message?: unknown }).message)
            : `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return body;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (
        !message.includes("fetch") &&
        !message.includes("Network request failed") &&
        !message.includes("Failed to fetch") &&
        !message.includes("timed out") &&
        !message.includes("CanceledError") &&
        !message.includes("AbortError")
      ) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError || "Request failed"));
};

/**
 * POST helper — sends JSON body and returns parsed response.
 */
const postJson = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  let lastError: unknown = null;

  for (const baseUrl of getApiBaseUrls()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(buildUrl(baseUrl, path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as T) : (null as T);

      if (!response.ok) {
        const message =
          typeof parsed === "object" && parsed !== null && "message" in parsed
            ? String((parsed as { message?: unknown }).message)
            : `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return parsed;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (
        !message.includes("fetch") &&
        !message.includes("Network request failed") &&
        !message.includes("Failed to fetch") &&
        !message.includes("timed out") &&
        !message.includes("CanceledError") &&
        !message.includes("AbortError")
      ) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError || "Request failed"));
};

export async function fetchPendingRescues(): Promise<RescueCaseRecord[]> {
  return requestJson<RescueCaseRecord[]>("/api/rescues/pending");
}

export async function fetchCompletedRescues(): Promise<RescueCaseRecord[]> {
  return requestJson<RescueCaseRecord[]>("/api/rescues/completed");
}

export async function fetchAllRescues(): Promise<RescueCaseRecord[]> {
  return requestJson<RescueCaseRecord[]>("/api/rescues/all");
}

export async function fetchRescueById(requestId: string): Promise<RescueByIdResponse> {
  return requestJson<RescueByIdResponse>(`/api/rescues/${encodeURIComponent(requestId)}`);
}

export async function fetchLiveTracking(requestId: string): Promise<LiveTrackingResponse> {
  const rescue = await fetchRescueById(requestId);
  return {
    ...rescue,
    case: rescue,
  };
}

export async function fetchUserRescues(userId: string = "logged-in-user"): Promise<RescueCaseRecord[]> {
  return requestJson<RescueCaseRecord[]>(`/api/rescues/my-rescues?userId=${encodeURIComponent(userId)}`);
}

// ── Comment API ────────────────────────────────────────────────────────────────

/** Fetch all comments (threaded) for a rescue case */
export async function fetchComments(rescueId: string): Promise<RescueComment[]> {
  return requestJson<RescueComment[]>(`/api/rescues/${encodeURIComponent(rescueId)}/comments`);
}

/** Post a new top-level comment on a rescue case */
export async function postComment(
  rescueId: string,
  text: string,
  userName: string = "You",
  userId: string = "guest-user"
): Promise<RescueComment> {
  return postJson<RescueComment>(`/api/rescues/${encodeURIComponent(rescueId)}/comments`, {
    text,
    userName,
    userId,
  });
}

/** Post a reply to an existing comment */
export async function postReply(
  rescueId: string,
  commentId: string,
  text: string,
  userName: string = "You",
  userId: string = "guest-user"
): Promise<RescueComment> {
  return postJson<RescueComment>(
    `/api/rescues/${encodeURIComponent(rescueId)}/comments/${encodeURIComponent(commentId)}/reply`,
    { text, userName, userId }
  );
}