import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const getStoredItem = async (key: string): Promise<string | null> => {
  if (Platform.OS !== "web") {
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    } catch (_err) {
      // Fallback to AsyncStorage if SecureStore fails
    }
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch (_err) {
    return null;
  }
};

export const setStoredItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS !== "web") {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (_err) {
      // Fallback to AsyncStorage if SecureStore fails
    }
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (_err) {
    console.error(`[Storage] Failed to set item for key ${key}:`, _err);
  }
};

export const removeStoredItem = async (key: string): Promise<void> => {
  if (Platform.OS !== "web") {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (_err) {
      // Fallback to AsyncStorage if SecureStore fails
    }
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (_err) {
    console.error(`[Storage] Failed to remove item for key ${key}:`, _err);
  }
};
