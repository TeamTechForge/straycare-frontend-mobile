import axios from "axios";
import { BASE_URL } from "../constants/config.constants";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createCommunityPost = (data) =>
  API.post("/api/community/create", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getCommunityFeed = () => API.get("/api/community");
export const getCommunityPost = (id) => API.get(`/api/community/${id}`);
export const reportCommunityPost = (id, data) => API.post(`/api/community/${id}/report`, data);


// ─── Create animal post (multipart/form-data for image upload) ───────────────
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


export default API;