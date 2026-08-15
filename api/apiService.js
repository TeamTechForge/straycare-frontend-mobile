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

import * as lostAndFoundService from "../services/lostAndFoundService";

// Delegate lost/found animal functions to lostAndFoundService for auth & upload handling
export const createAnimalPost = (data) => lostAndFoundService.createAnimalPost(data);
export const getLostPosts = () => lostAndFoundService.getLostPosts();
export const getFoundPosts = () => lostAndFoundService.getFoundPosts();
export const getAnimalPostById = (id) => lostAndFoundService.getAnimalPostById(id);
export const reportAnimalPost = (id) => lostAndFoundService.reportAnimalPost(id);

export default API;