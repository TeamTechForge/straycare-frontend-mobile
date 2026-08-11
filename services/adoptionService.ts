// services/adoptionService.ts
// Single file for all API calls + Cloudinary image upload

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Config (all values come from .env) ──────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Post {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    avatar: string | null;
    organisation: string | null;
  };
  category: string;
  customCategory?: string;
  breed: string;
  age: string;
  gender: string;
  name: string;
  status: "Available" | "Pending" | "Adopted";
  healthStatus: "Healthy" | "Needs Care" | "Under Treatment" | "Special Needs";
  description: string;
  traits: string[];
  images: string[];       // Cloudinary URLs
  location: string;
  posterName: string;
  contact: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  category: string;
  customCategory?: string;
  breed: string;
  age: string;
  gender: string;
  name: string;
  status: string;
  healthStatus: string;
  description: string;
  traits: string[];
  location: string;
  posterName: string;
  contact: string;
  notes?: string;
}

// ─── Cloudinary Image Upload ──────────────────────────────────────────────────

// Upload a single image to Cloudinary, returns the hosted URL
const uploadSingleImage = async (
  localUri: string,
  index: number
): Promise<string> => {
  const formData = new FormData();

  formData.append("file", {
    uri: localUri,
    name: `pet_photo_${index}.jpg`,
    type: "image/jpeg",
  } as any);

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "adoption_posts");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Image ${index + 1} upload failed`);
  }

  const data = await response.json();
  return data.secure_url; // https Cloudinary URL
};

// Upload multiple images, returns array of Cloudinary URLs
const uploadImages = async (localUris: string[]): Promise<string[]> => {
  return Promise.all(localUris.map((uri, i) => uploadSingleImage(uri, i)));
};

// ─── Post API Calls ───────────────────────────────────────────────────────────

// GET all posts — used in AdoptionCorner
export const getAllPosts = async (): Promise<Post[]> => {
  const { data } = await api.get<Post[]>("/posts");
  return data;
};

// GET single post by ID — used in PetDetailView
export const getPostById = async (postId: string): Promise<Post> => {
  const { data } = await api.get<Post>(`/posts/${postId}`);
  return data;
};

// POST create new post — used in PostPetAdoption
// Pass localImageUris (from expo-image-picker) — upload to Cloudinary happens here
export const createPost = async (
  payload: CreatePostPayload,
  localImageUris: string[]
): Promise<Post> => {
  // Step 1: upload images to Cloudinary
  const imageUrls = await uploadImages(localImageUris);

  // Step 2: send post + image URLs to backend
  const { data } = await api.post<Post>("/posts", {
    ...payload,
    images: imageUrls,
  });

  return data;
};

// PUT update existing post — used in edit screen
export const updatePost = async (
  postId: string,
  payload: Partial<CreatePostPayload>,
  newLocalImageUris?: string[] // pass only if user selected new images
): Promise<Post> => {
  let images: string[] | undefined = undefined;

  if (newLocalImageUris && newLocalImageUris.length > 0) {
    images = await uploadImages(newLocalImageUris);
  }

  const { data } = await api.put<Post>(`/posts/${postId}`, {
    ...payload,
    ...(images ? { images } : {}),
  });

  return data;
};

// DELETE post — used by owner or admin
export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};

// GET current user's own posts — used in My Posts screen
export const getMyPosts = async (): Promise<Post[]> => {
  const { data } = await api.get<Post[]>("/posts/my");
  return data;
};