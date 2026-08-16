import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend API base URL.
 *
 * Priority order:
 * 1. Explicit env override (EXPO_PUBLIC_API_URL)
 * 2. Dynamic Expo dev-server hostUri (automatically gets your PC's active IP from Metro)
 * 3. Hardcoded fallback IP
 */

const FALLBACK_IP = '172.20.10.6';
const BACKEND_PORT = 5000;

function resolveBaseUrl(): string {
  // 1. Explicit override. This allows a development build to use the hosted API.
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('[Config] Using EXPO_PUBLIC_API_URL:', envUrl);
    return envUrl.replace(/\/$/, '');
  }

  // 2. Dynamic auto-detection from Expo Metro bundler in __DEV__
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).developerManifest?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];

    // Reject tunnel hostnames — they can't reach your backend on port 5000
    const isTunnel = /\.(exp|expo)\.direct$|ngrok|\.ngrok-free\.app/i.test(host);

    if (!isTunnel && host !== 'localhost' && host !== '127.0.0.1') {
      console.log(`[Config] Auto-detected Expo hostUri IP: ${host}`);
      return `http://${host}:${BACKEND_PORT}`;
    }

    if (host === 'localhost' || host === '127.0.0.1') {
      if (Platform.OS === 'android') {
        console.log(`[Config] Android emulator detected, using 10.0.2.2:${BACKEND_PORT}`);
        return `http://10.0.2.2:${BACKEND_PORT}`;
      }
      return `http://localhost:${BACKEND_PORT}`;
    }
  }

  // 3. Fallback to current LAN IP
  console.warn(`[Config] Using fallback IP: ${FALLBACK_IP}`);
  return `http://${FALLBACK_IP}:${BACKEND_PORT}`;
}

export const BASE_URL = resolveBaseUrl();
export const API_URL = `${BASE_URL}/api`;

console.log('[Config] Final BASE_URL:', BASE_URL);
console.log('[Config] Final API_URL:', API_URL);

export default { BASE_URL, API_URL };
