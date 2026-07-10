import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (debuggerHost) {
    return `http://${debuggerHost}:5000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
};

const API = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const buildFormData = (data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === "images" && Array.isArray(value)) {
      const [image] = value;
      if (image && typeof image === "string" && image.startsWith("file://")) {
        const fileName = image.split("/").pop() || "image.jpg";
        formData.append("image", {
          uri: image,
          name: fileName,
          type: "image/jpeg",
        });
      }
      return;
    }

    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return formData;
};

// Create a new lost/found animal post
export const createAnimalPost = async (data) => {
  const hasImageUri =
    Array.isArray(data?.images) &&
    data.images.length > 0 &&
    typeof data.images[0] === "string" &&
    data.images[0].startsWith("file://");

  if (hasImageUri) {
    return API.post("/api/animals", buildFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  return API.post("/api/animals", data);
};

// Get lost posts
export const getLostPosts = async () => {
  const res = await API.get("/api/animals?status=lost");
  return res.data;
};

// Get found posts
export const getFoundPosts = async () => {
  const res = await API.get("/api/animals?status=found");
  return res.data;
};

export const getAnimalPostById = async (id) => {
  const res = await API.get(`/api/animals/${id}`);
  return res.data;
};

export const reportAnimalPost = async (id) => {
  const res = await API.post(`/api/animals/${id}/report`);
  return res.data;
};

export const createCommunityPost = async (data) => {
  const headers = data instanceof FormData ? {} : { "Content-Type": "application/json" };
  const res = await API.post("/api/community/create", data, { headers });
  return res;
};

export const getCommunityFeed = async () => {
  const res = await API.get("/api/community");
  return res.data;
};

export const getCommunityPost = async (id) => {
  const res = await API.get(`/api/community/${id}`);
  return res.data;
};

export const reportCommunityPost = async (id, data) => {
  const res = await API.post(`/api/community/${id}/report`, data);
  return res.data;
};


// ─── Create animal post (multipart/form-data for image upload) ───────────────
export const createAnimalPost = (data) => {
  const formData = new FormData();

  formData.append("status", data.status);
  formData.append("type", data.type);
  formData.append("breed", data.breed);
  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("location", data.location);
  formData.append("date", data.date);
  formData.append("contactName", data.contactName);
  formData.append("contactNumber", data.contactNumber);

  if (data.customType) formData.append("customType", data.customType);

  if (data.images && data.images.length > 0) {
    formData.append("image", {
      uri: data.images[0],
      name: "photo.jpg",
      type: "image/jpeg",
    });
  }

  return API.post("/api/animals", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ─── Get all lost posts ───────────────────────────────────────────────────────
export const getLostPosts = async () => {
  const res = await API.get("/api/animals?status=lost");
  return res.data;
};

// ─── Get all found posts ──────────────────────────────────────────────────────
export const getFoundPosts = async () => {
  const res = await API.get("/api/animals?status=found");
  return res.data;
};

// ─── Get a single post by ID ──────────────────────────────────────────────────
export const getAnimalPostById = async (id) => {
  const res = await API.get(`/api/animals/${id}`);
  return res.data;
};

// ─── Report a post ────────────────────────────────────────────────────────────
export const reportAnimalPost = async (id) => {
  const res = await API.post(`/api/animals/${id}/report`);
  return res.data;
};

export default API;