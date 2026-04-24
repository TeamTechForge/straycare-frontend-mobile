import axios from "axios";

const API = axios.create({
  baseURL: "http://10.225.98.94:5000",
});

export default API;