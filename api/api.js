import axios from "axios";

const API = axios.create({
  baseURL: "http://10.225.98.94:5000",
  headers: {
    "Content-Type": "application/json", 
  }, 
});

//create animal posts
export const createAnimalPost = (data) => {
  return API.post("/api/animals", data);
};

//get lost posts
export const getLostPosts = async () => {
  const res = await API.get("/api/animals");
  return res.data;     // Return the data directly
};

export default API;