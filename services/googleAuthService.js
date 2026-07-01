import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { API_URL } from "../constants/Config";

// Required for Expo Go auth session redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Custom hook that configures the Google OAuth request via expo-auth-session.
 * Returns { request, response, promptAsync } — call promptAsync() to launch
 * the Google account picker, then pass the response to handleGoogleSignIn().
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

  });

  return {
    request,
    response,
    promptAsync,
    isReady: !!request,
  };
}

/**
 * Complete the Google Sign-In flow after expo-auth-session returns.
 *
 * Flow:
 * 1. Extract id_token from the auth session response
 * 2. Create a Firebase GoogleAuthProvider credential
 * 3. Sign in to Firebase with that credential
 * 4. Get the Firebase ID token
 * 5. Send it to the backend POST /api/auth/google
 * 6. Return the backend response { success, token, user, isNewUser }
 *
 * @param {object} response - The response object from useAuthRequest
 * @returns {Promise<{ success: boolean, token: string, user: object, isNewUser: boolean }>}
 * @throws {Error} with a descriptive message for each failure point
 */
export async function handleGoogleSignIn(response) {
  // Step 1: Validate the auth session response
  if (!response) {
    throw new Error("No response received from Google Sign-In.");
  }

  if (response.type === "dismiss" || response.type === "cancel") {
    throw new Error("CANCELLED");
  }

  if (response.type !== "success") {
    throw new Error(
      `Google Sign-In failed with type: ${response.type}. Please try again.`
    );
  }

  const { id_token } = response.params;

  if (!id_token) {
    throw new Error(
      "Failed to obtain ID token from Google. Please try again."
    );
  }

  // Step 2–3: Authenticate with Firebase using the Google credential
  let firebaseUser;
  try {
    const credential = GoogleAuthProvider.credential(id_token);
    const userCredential = await signInWithCredential(auth, credential);
    firebaseUser = userCredential.user;
  } catch (error) {
    const message =
      error.code === "auth/invalid-credential"
        ? "Google credential is invalid or expired. Please try again."
        : error.code === "auth/network-request-failed"
          ? "Network error during authentication. Please check your connection."
          : `Firebase authentication failed: ${error.message}`;
    throw new Error(message);
  }

  // Step 4: Get the Firebase ID token to send to the backend
  let firebaseIdToken;
  try {
    firebaseIdToken = await firebaseUser.getIdToken();
  } catch (error) {
    throw new Error("Failed to obtain Firebase ID token. Please try again.");
  }

  // Step 5: Send the Firebase ID token to the backend
  let backendResponse;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: firebaseIdToken }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    backendResponse = await res.json();

    if (!res.ok) {
      throw new Error(
        backendResponse.message || "Backend authentication failed."
      );
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The server took too long to respond. Please check your connection and try again."
      );
    }
    // Re-throw if it's already our custom error
    if (error.message && !error.message.includes("fetch")) {
      throw error;
    }
    throw new Error(
      "Could not connect to the backend server. Please check your network connection."
    );
  }

  // Step 6: Return the backend response
  return {
    success: backendResponse.success,
    token: backendResponse.token,
    user: backendResponse.user,
    isNewUser: backendResponse.isNewUser,
  };
}
