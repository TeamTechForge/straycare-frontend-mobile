import axios from "axios";

const API = axios.create({
  baseURL: "http://10.225.98.94:5000",
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