// services/communityService.ts

import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_URL } from "../constants/config.constants";

// ─────────────────────────────────────────────
// CLOUDINARY CONFIG
// ─────────────────────────────────────────────

const CLOUDINARY_CLOUD_NAME =
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";

const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    "";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface CommunityPost {
    _id: string;
    title: string;
    content: string;
    category: string;

    authorName?: string;

    imageUrl?: string | null;

    submittedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCommunityPostPayload {
    title: string;
    content: string;
    category: string;
}

// ─────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─────────────────────────────────────────────
// CLOUDINARY IMAGE UPLOAD
// ─────────────────────────────────────────────

const uploadImageToCloudinary = async (
    localUri: string
): Promise<string> => {
    // If image is already a remote URL,
    // do not upload it again.
    if (
        localUri.startsWith("http://") ||
        localUri.startsWith("https://")
    ) {
        return localUri;
    }

    if (
        !CLOUDINARY_CLOUD_NAME ||
        !CLOUDINARY_UPLOAD_PRESET
    ) {
        throw new Error(
            "Cloudinary configuration is missing. Please check EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
        );
    }

    const formData = new FormData();

    // Web
    if (Platform.OS === "web") {
        const response = await fetch(localUri);

        if (!response.ok) {
            throw new Error("Unable to read selected image.");
        }

        const blob = await response.blob();

        formData.append(
            "file",
            blob,
            "community_post.jpg"
        );
    }

    // Android / iOS
    else {
        formData.append("file", {
            uri: localUri,
            name: "community_post.jpg",
            type: "image/jpeg",
        } as any);
    }

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    formData.append(
        "folder",
        "community_posts"
    );

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        let message = "Cloudinary image upload failed.";

        try {
            const errorData = await response.json();

            if (errorData?.error?.message) {
                message = errorData.error.message;
            }
        } catch {
            // Ignore JSON parsing errors
        }

        throw new Error(message);
    }

    const data = await response.json();

    if (!data?.secure_url) {
        throw new Error(
            "Cloudinary did not return an image URL."
        );
    }

    return data.secure_url;
};

// ─────────────────────────────────────────────
// CREATE COMMUNITY POST
// ─────────────────────────────────────────────

export const createCommunityPost = async (
    payload: CreateCommunityPostPayload,
    localImageUri?: string
): Promise<CommunityPost> => {
    let imageUrl: string | undefined;

    // Upload image first
    if (localImageUri) {
        imageUrl = await uploadImageToCloudinary(
            localImageUri
        );
    }

    // Send post data to backend
    const response = await api.post<CommunityPost>(
        "/community/create",
        {
            ...payload,
            ...(imageUrl ? { imageUrl } : {}),
        }
    );

    return response.data;
};

// ─────────────────────────────────────────────
// GET COMMUNITY FEED
// ─────────────────────────────────────────────

export const getCommunityFeed = async (): Promise<
    CommunityPost[]
> => {
    const response = await api.get<CommunityPost[]>(
        "/community"
    );

    return response.data;
};

// ─────────────────────────────────────────────
// GET SINGLE COMMUNITY POST
// ─────────────────────────────────────────────

export const getCommunityPost = async (
    id: string
): Promise<CommunityPost> => {
    const response = await api.get<CommunityPost>(
        `/community/${id}`
    );

    return response.data;
};

// ─────────────────────────────────────────────
// REPORT COMMUNITY POST
// ─────────────────────────────────────────────

export const reportCommunityPost = async (
    id: string,
    reason?: string
): Promise<any> => {
    const response = await api.post(
        `/community/${id}/report`,
        reason ? { reason } : {}
    );

    return response.data;
};

export default api;