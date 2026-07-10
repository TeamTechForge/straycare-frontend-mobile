import Constants from 'expo-constants';

/**
 * Resolves the backend API base URL.
 *
 * Priority order:
 * 1. Explicit env override  (EXPO_PUBLIC_API_URL)
 * 2. Expo dev-server hostUri (works on LAN / USB)
 * 3. Hardcoded fallback      (update when your network changes)
 */

// ✅ CHANGE THIS to your machine's current LAN IP whenever your network changes.
//    Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find it.
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

  // 2. Extract host IP from Expo dev-server URI (works for LAN/USB, NOT tunnel)
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.8.142:8081"
  if (hostUri) {
    const host = hostUri.split(':')[0];

    // Reject tunnel hostnames — they can't reach your backend on port 5000
    const isTunnel = /\.(exp|expo)\.direct$|ngrok|\.ngrok-free\.app/i.test(host);

    if (!isTunnel && host !== 'localhost' && host !== '127.0.0.1') {
      console.log(`[Config] Using Expo hostUri IP: ${host}`);
      return `http://${host}:${BACKEND_PORT}`;
    }

    console.warn(
      `[Config] Detected tunnel/localhost hostUri (${hostUri}). ` +
      `Falling back to ${FALLBACK_IP} for backend API on port ${BACKEND_PORT}.`
    );
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
