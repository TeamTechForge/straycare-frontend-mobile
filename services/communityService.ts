// services/communityService.ts

import { create } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "@/constants/config.constants";

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// ─── Attach JWT Token Automatically ──────────────────────────────────────────

api.interceptors.request.use(async (config: any) => {
    let token: string | null = null;

    try {
        token = await SecureStore.getItemAsync("authToken");
    } catch {
        // SecureStore may not be available on web
    }

    if (!token) {
        try {
            token =
                (await AsyncStorage.getItem("authToken")) ??
                (await AsyncStorage.getItem("token"));
        } catch {
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
    authorUserId?: string | null;
    authorId?: string | null;
    username?: string;
    profileImage?: string;
    authorName?: string;
    title?: string;
    category?: string;
    content?: string;
    imageUrl?: string | null;
    submittedAt?: string;
    date?: string;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    isSaved: boolean;
    isOwner: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CommunityLikeState {
    postId: string;
    isLiked: boolean;
    likeCount: number;
}

export interface CommunityComment {
    _id: string;
    postId: string;
    userId: string;
    parentCommentId?: string | null;
    username: string;
    profileImage: string;
    content: string;
    canDelete?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CommunityCommentsResponse {
    comments: CommunityComment[];
    commentCount: number;
}

export interface CommunitySaveState {
    postId: string;
    isSaved: boolean;
}

interface ApiResponse<T> {
    data?: T;
    commentCount?: number;
}

interface NativeImageFile {
    uri: string;
    name: string;
    type: string;
}

type CommunityPostInput = Record<string, unknown>;

// The backend may return a value directly or wrap it in a `data` property.
const unwrapData = <T>(body: ApiResponse<T> | T): T =>
    typeof body === "object" && body !== null && "data" in body && body.data !== undefined
        ? body.data
        : body as T;

const createImageFile = (imageUri: string): NativeImageFile => {
    const filename = imageUri.split("/").pop() ?? "photo.jpg";
    const extension = filename.split(".").pop()?.toLowerCase() ?? "jpg";

    return {
        uri: imageUri,
        name: filename,
        type: extension === "png" ? "image/png" : "image/jpeg",
    };
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error !== "object" || error === null) {
        return fallback;
    }

    const apiError = error as {
        message?: string;
        response?: { data?: { message?: string } };
    };

    return apiError.response?.data?.message || apiError.message || fallback;
};

// ─── Create Community Post ────────────────────────────────────────────────────

export const createCommunityPost = async (
    data: FormData | CommunityPostInput,
    imageUri?: string
): Promise<CommunityPost> => {
    let payload = data;
    // Keep object-based callers supported while converting image uploads to multipart data.
    if (!(data instanceof FormData) && imageUri) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });
        formData.append("image", createImageFile(imageUri) as unknown as Blob);
        payload = formData;
    }

    const response = await api.post<ApiResponse<CommunityPost> | CommunityPost>(
        "/api/community/create",
        payload,
        data instanceof FormData || payload instanceof FormData
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : undefined
    );

    return unwrapData(response.data);
};

// ─── Get Community Feed ───────────────────────────────────────────────────────

export const getCommunityFeed = async (): Promise<CommunityPost[]> => {
    const response = await api.get<ApiResponse<CommunityPost[]> | CommunityPost[]>(
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
    const response = await api.get<ApiResponse<CommunityPost> | CommunityPost>(
        `/api/community/${id}`
    );

    return unwrapData(response.data);
};

export const updateCommunityPost = async (
    id: string,
    data: FormData | Record<string, unknown>
): Promise<CommunityPost> => {
    const response = await api.put<ApiResponse<CommunityPost> | CommunityPost>(`/api/community/${id}`, data,
        data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
    return unwrapData(response.data);
};

export const deleteCommunityPost = async (id: string): Promise<void> => {
    await api.delete(`/api/community/${id}`);
};

const unwrapPostList = (body: ApiResponse<CommunityPost[]> | CommunityPost[]): CommunityPost[] =>
    Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);

export const getMyCommunityPosts = async (): Promise<CommunityPost[]> => {
    const response = await api.get<ApiResponse<CommunityPost[]> | CommunityPost[]>("/api/community/mine");
    return unwrapPostList(response.data);
};

export const getSavedCommunityPosts = async (): Promise<CommunityPost[]> => {
    const response = await api.get<ApiResponse<CommunityPost[]> | CommunityPost[]>("/api/community/saved");
    return unwrapPostList(response.data);
};

export const likeCommunityPost = async (id: string): Promise<CommunityLikeState> => {
    const response = await api.post<ApiResponse<CommunityLikeState> | CommunityLikeState>(`/api/community/${id}/like`);
    return unwrapData(response.data);
};

export const unlikeCommunityPost = async (id: string): Promise<CommunityLikeState> => {
    const response = await api.delete<ApiResponse<CommunityLikeState> | CommunityLikeState>(`/api/community/${id}/like`);
    return unwrapData(response.data);
};

export const saveCommunityPost = async (id: string): Promise<CommunitySaveState> => {
    const response = await api.post<ApiResponse<CommunitySaveState> | CommunitySaveState>(`/api/community/${id}/save`);
    return unwrapData(response.data);
};

export const unsaveCommunityPost = async (id: string): Promise<CommunitySaveState> => {
    const response = await api.delete<ApiResponse<CommunitySaveState> | CommunitySaveState>(`/api/community/${id}/save`);
    return unwrapData(response.data);
};

export const getCommunityComments = async (id: string): Promise<CommunityCommentsResponse> => {
    const response = await api.get<ApiResponse<CommunityComment[]>>(`/api/community/${id}/comments`);
    return {
        comments: Array.isArray(response.data?.data) ? response.data.data : [],
        commentCount: Number(response.data?.commentCount) || 0,
    };
};

export const createCommunityComment = async (
    id: string,
    content: string,
    parentCommentId?: string | null
): Promise<{ comment: CommunityComment; commentCount: number }> => {
    const response = await api.post<ApiResponse<CommunityComment>>(`/api/community/${id}/comments`, {
        content,
        parentCommentId: parentCommentId || undefined,
    });
    return {
        comment: response.data.data as CommunityComment,
        commentCount: Number(response.data?.commentCount) || 0,
    };
};

export const deleteCommunityComment = async (
    postId: string,
    commentId: string
): Promise<{ commentId: string; commentCount: number }> => {
    const response = await api.delete<ApiResponse<{ commentCount?: number }>>(`/api/community/${postId}/comments/${commentId}`);
    return {
        commentId,
        commentCount: Number(response.data?.data?.commentCount) || 0,
    };
};

// ─── Report Community Post ────────────────────────────────────────────────────

export const reportCommunityPost = async (
    id: string,
    data?: string | Record<string, unknown>
): Promise<unknown> => {
    const payload = typeof data === "string" ? { reason: data } : (data ?? {});
    const response = await api.post<ApiResponse<unknown> | unknown>(
        `/api/community/${id}/report`,
        payload
    );

    return unwrapData(response.data);
};

export default api;
