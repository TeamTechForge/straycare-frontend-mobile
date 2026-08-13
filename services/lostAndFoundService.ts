// services/lostAndFoundService.ts
// Single file for all Lost & Found animal post API calls

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_URL } from "@/constants/config.constants";

// ─── Config (Cloudinary values come from .env) ───────────────────────────────

const CLOUDINARY_CLOUD_NAME =
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
const CLOUDINARY_UPLOAD_PRESET =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    "";

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
    baseURL: `${API_URL}`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config: any) => {
    let token: string | null = null;
    try {
        token = await SecureStore.getItemAsync("authToken");
    } catch (_err) {
        // SecureStore unsupported or failed on web
    }

    if (!token) {
        try {
            token = (await AsyncStorage.getItem("authToken")) ?? (await AsyncStorage.getItem("token"));
        } catch (_err) {
            // AsyncStorage fallback check
        }
    }

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnimalStatus = "lost" | "found";

export interface AnimalPost {
    _id: string;
    userId: {
        _id: string;
        name: string;
        phone?: string;
        avatar?: string | null;
    } | string;
    status: AnimalStatus;
    type?: "dog" | "cat" | "other";
    customType?: string;
    breed?: string;
    name?: string;
    description: string;
    location: string;
    date?: string;
    contactName?: string;
    contactNumber?: string;
    imageUrl?: string;
    images?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateAnimalPostPayload {
    status: AnimalStatus;
    type?: "dog" | "cat" | "other";
    customType?: string;
    breed?: string;
    name?: string;
    description: string;
    location: string;
    date?: string;
    contactName?: string;
    contactNumber?: string;
    images?: string[]; // local file:// URIs or URLs
    [key: string]: any;
}

// ─── Cloudinary Image Upload ──────────────────────────────────────────────────

// Upload a single image to Cloudinary, returns the hosted URL
const uploadSingleImage = async (
    localUri: string,
    index: number
): Promise<string> => {
    // If image is already a remote HTTP/HTTPS URL, don't re-upload
    if (localUri.startsWith("http://") || localUri.startsWith("https://")) {
        return localUri;
    }

    const formData = new FormData();

    if (Platform.OS === "web") {
        const res = await fetch(localUri);
        const blob = await res.blob();
        formData.append("file", blob, `animal_photo_${index}.jpg`);
    } else {
        formData.append("file", {
            uri: localUri,
            name: `animal_photo_${index}.jpg`,
            type: "image/jpeg",
        } as any);
    }

    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "lost_and_found_posts");

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        if (!response.ok) {
            throw new Error(`Image ${index + 1} upload failed`);
        }

        const data = await response.json();
        return data.secure_url;
    }

    // Fallback: upload through backend /upload/cloudinary when client-side Cloudinary is not configured.
    const response = await fetch(`${API_URL}/upload/cloudinary`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        let errorText = `Image ${index + 1} upload failed`;
        try {
            const json = await response.json();
            if (json?.message) {
                errorText = json.message;
            }
        } catch (_e) {
            // ignore JSON parse errors
        }
        throw new Error(errorText);
    }

    const json: any = await response.json();
    return json.url;
};

// Upload multiple images, returns array of Cloudinary URLs
const uploadImages = async (localUris: string[]): Promise<string[]> => {
    return Promise.all(localUris.map((uri, i) => uploadSingleImage(uri, i)));
};

// ─── Lost & Found Animal Post API Calls ───────────────────────────────────────

// POST create new lost/found animal post
export const createAnimalPost = async (
    payload: CreateAnimalPostPayload
): Promise<AnimalPost> => {
    const localUris = (payload.images || []).filter(
        (img) => typeof img === "string" && (img.startsWith("file://") || img.startsWith("content://"))
    );

    const imageUrls =
        localUris.length > 0 ? await uploadImages(localUris) : payload.images || [];

    const { data } = await api.post<AnimalPost>("/animals", {
        ...payload,
        imageUrl: imageUrls[0] || payload.imageUrl || undefined,
        images: imageUrls,
    });

    return data;
};

// GET all lost posts
export const getLostPosts = async (): Promise<AnimalPost[]> => {
    const { data } = await api.get<AnimalPost[]>("/animals?status=lost");
    return data;
};

// GET all found posts
export const getFoundPosts = async (): Promise<AnimalPost[]> => {
    const { data } = await api.get<AnimalPost[]>("/animals?status=found");
    return data;
};

// GET single animal post by ID
export const getAnimalPostById = async (id: string): Promise<AnimalPost> => {
    const { data } = await api.get<AnimalPost>(`/animals/${id}`);
    return data;
};

// PUT update animal post
export const updateAnimalPost = async (
    id: string,
    payload: Partial<CreateAnimalPostPayload>
): Promise<AnimalPost> => {
    let imageUrl = payload.imageUrl;
    if (payload.images && payload.images.length > 0) {
        const localUris = payload.images.filter(
            (img) => typeof img === "string" && (img.startsWith("file://") || img.startsWith("content://"))
        );
        if (localUris.length > 0) {
            const uploaded = await uploadImages(localUris);
            imageUrl = uploaded[0];
        } else {
            imageUrl = payload.images[0];
        }
    }

    const { data } = await api.put<AnimalPost>(`/animals/${id}`, {
        ...payload,
        imageUrl,
    });

    return data;
};

// DELETE animal post
export const deleteAnimalPost = async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/animals/${id}`);
    return data;
};

// POST report an animal post
export const reportAnimalPost = async (id: string): Promise<{ message: string; reportCount: number }> => {
    const { data } = await api.post<{ message: string; reportCount: number }>(`/animals/${id}/report`);
    return data;
};

export default api;