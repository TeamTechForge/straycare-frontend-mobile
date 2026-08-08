import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import {
  Auth,
  initializeAuth,
  getAuth,
} from "firebase/auth";
// @ts-ignore - Known issue in Firebase SDK types missing getReactNativePersistence
import { getReactNativePersistence } from "firebase/auth";

const hasFirebaseConfig =
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY.trim() !== "";

let app: FirebaseApp;
let auth: Auth;

if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  // Prevent re-initialization on hot reload
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Auth with AsyncStorage persistence for React Native
  try {
    auth = initializeAuth(app!, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // If auth is already initialized (hot reload), retrieve existing instance
    auth = getAuth(app!);
  }
} else {
  console.warn(
    "[Firebase] WARNING: EXPO_PUBLIC_FIREBASE_API_KEY is not set or empty. Firebase services will be disabled."
  );
  // These will be undefined at runtime when Firebase is disabled.
  // Callers should guard against this if Firebase may not be configured.
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export { app, auth };
export default app;
