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
});

export const createCommunityPost = (data) => {
  const headers =
    data instanceof FormData
      ? {}
      : { "Content-Type": "application/json" };

  return API.post("/api/community/create", data, { headers });
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

export const resolveImageUrl = (path) => {
  if (!path) return null;

  if (path.startsWith("http")) {
    return path;
  }

  return `${getBaseUrl()}${path}`;
};

export default API;



