import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getPlaceDetails, PlacePrediction, searchPlaces } from "../../services/places.service";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  value: string;
  hasError?: boolean;
  hasValidCoordinates: boolean;
  onTextChange: (text: string) => void;
  onPlaceSelected: (description: string, coordinates: Coordinates) => void;
};

const createSessionToken = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function AdoptionLocationSearchInput({ value, hasError, hasValidCoordinates, onTextChange, onPlaceSelected }: Props) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectionLocked, setSelectionLocked] = useState(false);
  const sessionTokenRef = useRef(createSessionToken());

  // Only the latest request may update suggestions, preventing stale results from winning a race.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const input = value.trim();
    if (selectionLocked || hasValidCoordinates || input.length < 2) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setLoading(false);
      if (!input) setError("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const results = await searchPlaces(input, sessionTokenRef.current);
        if (requestId !== requestIdRef.current) return;
        setSuggestions(results);
        if (results.length === 0) setError("No matching locations found.");
      } catch (requestError: unknown) {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setError(requestError instanceof Error ? requestError.message : "Location search is unavailable. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [hasValidCoordinates, selectionLocked, value]);

  const selectSuggestion = async (suggestion: PlacePrediction) => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError("");
      const details = await getPlaceDetails(suggestion.placeId, sessionTokenRef.current);
      if (requestId !== requestIdRef.current) return;
      setSelectionLocked(true);
      setSuggestions([]);
      onPlaceSelected(details.description || suggestion.description, {
        latitude: details.latitude,
        longitude: details.longitude,
      });
      sessionTokenRef.current = createSessionToken();

    } catch (requestError: unknown) {
      if (requestId !== requestIdRef.current) return;
      
      setError(requestError instanceof Error ? requestError.message : "Could not load that location. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  return (
    <View>
      <View style={[styles.inputWrapper, hasError && styles.inputError]}>
        <Ionicons name="location-outline" size={18} color="#717878" />
        <TextInput
          style={styles.input}
          placeholder="Search address or area here"
          placeholderTextColor="#A8A497"
          value={value}
          autoCorrect={false}
          returnKeyType="search"
          onChangeText={(text) => {
            setSelectionLocked(false);
            setError("");
            onTextChange(text);
          }}
        />
        {loading && <ActivityIndicator size="small" color="#F5A623" />}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.slice(0, 5).map((suggestion) => (
            <TouchableOpacity key={suggestion.placeId} style={styles.suggestion} onPress={() => void selectSuggestion(suggestion)}>
              <Ionicons name="location" size={16} color="#F5A623" />
              <Text style={styles.suggestionText}>{suggestion.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: { minHeight: 48, borderWidth: 1.5, borderColor: "#E2E0D6", borderRadius: 10, paddingHorizontal: 13, backgroundColor: "#F3F4F5", flexDirection: "row", alignItems: "center", gap: 8 },
  inputError: { borderColor: "#B00020", backgroundColor: "#FFF8F8" },
  input: { flex: 1, color: "#191C1D", fontSize: 14, paddingVertical: 11 },
  suggestions: { marginTop: 4, maxHeight: 230, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, backgroundColor: "#FFFFFF", overflow: "hidden", elevation: 4 },
  suggestion: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E0D6" },
  suggestionText: { flex: 1, color: "#191C1D", fontSize: 13 },
  errorText: { color: "#B00020", fontSize: 11, marginTop: 5 },
});
