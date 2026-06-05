// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDdt27L_3CLAga8yP6QrYFYTM3dZdxrzro",
  authDomain: "straycare-43a56.firebaseapp.com",
  projectId: "straycare-43a56",
  storageBucket: "straycare-43a56.firebasestorage.app",
  messagingSenderId: "989190543918",
  appId: "1:989190543918:web:1faedf11dd7fe207f95dbf",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);


  //measurementId: "G-YEXX24NVQ7"