import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

/**
 * For local development, we need to use the host machine's IP address.
 * Constants.expoConfig.hostUri usually contains the IP:Port of the dev server.
 */
const debuggerHost = Constants.expoConfig?.hostUri;
let hostIP = debuggerHost ? debuggerHost.split(':')[0] : '172.20.10.3'; 

// Try to extract dynamic host IP from Metro packager script URL
try {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1]?.split('/')[0];
    const hostname = address?.split(':')[0];
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      hostIP = hostname;
      console.log("Dynamically extracted Host IP from scriptURL:", hostIP);
    }
  }
} catch (error) {
  console.warn("Failed to get host IP from scriptURL:", error);
}

console.log("Debugger Host:", debuggerHost);
console.log("Detected Host IP:", hostIP);
console.log("Current OS IP (Fallback): 172.20.10.3");

export const BASE_URL = `http://${hostIP}:5000`;
export const API_URL = `${BASE_URL}/api`;

console.log("Final API_URL:", API_URL);

export default {
  BASE_URL,
  API_URL,
};

