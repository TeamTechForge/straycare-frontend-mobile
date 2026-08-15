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
    data: FormData | Record<string, any>
): Promise<CommunityPost> => {
    const response = await api.post<any>(
        "/api/community/create",
        data
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
    data?: Record<string, any>
) => {
    const response = await api.post<any>(
        `/api/community/${id}/report`,
        data ?? {}
    );

    const body = response.data;
    return body && body.data ? body.data : body;
};

export default api;