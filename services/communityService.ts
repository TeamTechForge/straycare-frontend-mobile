// services/communityService.ts

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "@/constants/config.constants";

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Attach JWT Token Automatically ──────────────────────────────────────────

api.interceptors.request.use(async (config: any) => {
    let token: string | null = null;

    try {
        token = await SecureStore.getItemAsync("authToken");
    } catch (_err) {
        // SecureStore may not be available on web
    }

    if (!token) {
        try {
            token =
                (await AsyncStorage.getItem("authToken")) ??
                (await AsyncStorage.getItem("token"));
        } catch (_err) {
            // AsyncStorage fallback
        }
    }

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityPost {
    _id: string;
    userId?: any;
    title?: string;
    description?: string;
    images?: string[];
    location?: string;
    createdAt?: string;
    updatedAt?: string;

    [key: string]: any;
}

// ─── Create Community Post ────────────────────────────────────────────────────

export const createCommunityPost = async (
    data: FormData | Record<string, any>,
    imageUri?: string
): Promise<CommunityPost> => {
    let payload = data;
    if (!(data instanceof FormData) && imageUri) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });
        const filename = imageUri.split("/").pop() ?? "photo.jpg";
        const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";
        formData.append("image", {
            uri: imageUri,
            name: filename,
            type: mimeType,
        } as any);
        payload = formData;
    }

    const response = await api.post<any>(
        "/api/community/create",
        payload,
        payload instanceof FormData
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : undefined
    );

    const body = response.data;
    return body && body.data ? body.data : body;
};

// ─── Get Community Feed ───────────────────────────────────────────────────────

export const getCommunityFeed = async (): Promise<CommunityPost[]> => {
    const response = await api.get<any>(
        "/api/community"
    );

    const body = response.data;
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data)) return body.data;
    return [];
};

// ─── Get Single Community Post ────────────────────────────────────────────────

export const getCommunityPost = async (
    id: string
): Promise<CommunityPost> => {
    const response = await api.get<any>(
        `/api/community/${id}`
    );

    const body = response.data;
    return body && body.data ? body.data : body;
};

// ─── Report Community Post ────────────────────────────────────────────────────

export const reportCommunityPost = async (
    id: string,
    data?: string | Record<string, any>
) => {
    const payload = typeof data === "string" ? { reason: data } : (data ?? {});
    const response = await api.post<any>(
        `/api/community/${id}/report`,
        payload
    );

    const body = response.data;
    return body && body.data ? body.data : body;
};

export default api;