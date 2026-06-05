import axios from "axios";

const API = axios.create({
  baseURL: "http://10.87.129.94:5000",
  headers: {
    "Content-Type": "application/json",
  },
});


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