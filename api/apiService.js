import { create } from "axios";
import { BASE_URL } from "../constants/config.constants";

const API = create({
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

export default API;
