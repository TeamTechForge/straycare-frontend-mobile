import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend API base URL.
 *
 * Priority order:
 * 1. Explicit env override  (EXPO_PUBLIC_API_URL)
 * 2. Expo dev-server hostUri (works on LAN / USB / Web)
 * 3. Hardcoded fallback      (update when your network changes)
 */

const FALLBACK_IP = '192.168.8.142';
const BACKEND_PORT = 5000;

function resolveBaseUrl(): string {
  // 1. Explicit override always wins
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('[Config] Using EXPO_PUBLIC_API_URL:', envUrl);
    return envUrl;
  }

  // 2. Extract host IP from Expo dev-server URI
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.8.142:8081" or "localhost:8081"
  if (hostUri) {
    const host = hostUri.split(':')[0];

    // On Web platform, localhost/127.0.0.1 points to the local machine running the backend
    if (Platform.OS === 'web') {
      console.log(`[Config] Web platform detected. Using host: ${host}`);
      return `http://${host}:${BACKEND_PORT}`;
    }

    // Reject tunnel hostnames — they can't reach your backend on port 5000
    const isTunnel = /\.(exp|expo)\.direct$|ngrok|\.ngrok-free\.app/i.test(host);

    if (!isTunnel && host !== 'localhost' && host !== '127.0.0.1') {
      console.log(`[Config] Using Expo hostUri IP: ${host}`);
      return `http://${host}:${BACKEND_PORT}`;
    }

    console.warn(
      `[Config] Detected tunnel/localhost hostUri (${hostUri}) on mobile native. ` +
      `Falling back to ${FALLBACK_IP} for backend API on port ${BACKEND_PORT}.`
    );
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // 3. Fallback to known LAN IP
  console.warn(`[Config] Using fallback IP: ${FALLBACK_IP}`);
  return `http://${FALLBACK_IP}:${BACKEND_PORT}`;
}

export const BASE_URL = resolveBaseUrl();
export const API_URL = `${BASE_URL}/api`;

console.log('[Config] Final BASE_URL:', BASE_URL);
console.log('[Config] Final API_URL:', API_URL);

export default { BASE_URL, API_URL };
