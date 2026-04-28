import axios from "axios";

const API = axios.create({
  baseURL: "http://10.225.98.94:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// create animal posts (multipart/form-data for image upload)
export const createAnimalPost = (data) => {
  const formData = new FormData();

  // Append all text fields
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

  // Append image as a file object
  if (data.images && data.images.length > 0) {
    formData.append("image", {
      uri: data.images[0],
      name: "photo.jpg",
      type: "image/jpeg",
    });
  }

  return API.post("/api/animals", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// get lost posts
export const getLostPosts = async () => {
  const res = await API.get("/api/animals");
  return res.data;
};

export default API;