import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/config.constants";

export type PlacePrediction = {
  placeId: string;
  description: string;
};

export type PlaceDetails = PlacePrediction & {
  latitude: number;
  longitude: number;
};

const authenticatedGet = async <T>(path: string): Promise<T> => {
  const token = await SecureStore.getItemAsync("authToken");
  if (!token) {
    throw new Error("Please sign in to search for a location.");
  }

  const response = await fetch(`${API_URL}/strays${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
};

export const searchPlaces = async (
  input: string,
  sessionToken: string
): Promise<PlacePrediction[]> => {
  const query = new URLSearchParams({ input, sessionToken });
  const result = await authenticatedGet<{ predictions?: PlacePrediction[] }>(
    `/places/autocomplete?${query.toString()}`
  );
  return Array.isArray(result.predictions) ? result.predictions : [];
};

export const getPlaceDetails = async (
  placeId: string,
  sessionToken: string
): Promise<PlaceDetails> => {
  const query = new URLSearchParams({ placeId, sessionToken });
  return authenticatedGet<PlaceDetails>(`/places/details?${query.toString()}`);
};
