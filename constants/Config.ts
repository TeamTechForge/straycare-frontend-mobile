import Constants from 'expo-constants';

/**
 * For local development, we need to use the host machine's IP address.
 * Constants.expoConfig.hostUri usually contains the IP:Port of the dev server.
 */
const debuggerHost = Constants.expoConfig?.hostUri;
const hostIP = debuggerHost ? debuggerHost.split(':')[0] : '192.168.8.142'; 

console.log("Debugger Host:", debuggerHost);
console.log("Detected Host IP:", hostIP);
console.log("Current OS IP (Fallback): 192.168.8.142");

export const BASE_URL = `http://${hostIP}:5000`;
export const API_URL = `${BASE_URL}/api`;

console.log("Final API_URL:", API_URL);

export default {
  BASE_URL,
  API_URL,
};
