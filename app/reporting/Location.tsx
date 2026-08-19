import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";
import { SafeAreaView } from "react-native-safe-area-context";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const safe = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : value || "";

const DEFAULT_SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 3.2,
  longitudeDelta: 3.2,
};

export default function LocationPicker() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = safe(params.mode) === "edit";
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [address, setAddress] = useState(safe(params.locationAddress));
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchAddress = useCallback(async (latitude: number, longitude: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const item = result[0];
        const formatted = [item.name, item.street, item.city, item.region]
          .filter(Boolean)
          .join(", ");
        setAddress(formatted || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      } else {
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error("[ReportLocation] Reverse geocoding failed:", error);
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  }, []);

  const requestCurrentLocation = useCallback(async () => {
    setLoading(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setRegion(DEFAULT_SRI_LANKA_REGION);
        setAddress("Move the pin to the incident location");
        setLocationError(
          "Location permission is off. You can still drag the pin to choose the incident location."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextRegion = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(nextRegion);
      await fetchAddress(nextRegion.latitude, nextRegion.longitude);
    } catch (error) {
      console.error("[ReportLocation] Current location failed:", error);
      setRegion(DEFAULT_SRI_LANKA_REGION);
      setAddress("Move the pin to the incident location");
      setLocationError(
        "Your location could not be retrieved. Drag the pin to choose the incident location, or try GPS again."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchAddress]);

  useEffect(() => {
    const savedLatitude = Number(safe(params.locationLat));
    const savedLongitude = Number(safe(params.locationLng));
    const hasSavedLocation =
      isEditing &&
      Number.isFinite(savedLatitude) &&
      Number.isFinite(savedLongitude) &&
      savedLatitude >= -90 &&
      savedLatitude <= 90 &&
      savedLongitude >= -180 &&
      savedLongitude <= 180;

    if (hasSavedLocation) {
      const savedRegion = {
        latitude: savedLatitude,
        longitude: savedLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(savedRegion);
      setLoading(false);
      if (!safe(params.locationAddress)) {
        void fetchAddress(savedLatitude, savedLongitude);
      }
      return;
    }

    void requestCurrentLocation();
  }, [fetchAddress, isEditing, params.locationAddress, params.locationLat, params.locationLng, requestCurrentLocation]);

  const onMarkerDragEnd = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    if (!region) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setRegion({ ...region, latitude, longitude });
    setLocationError(null);
    void fetchAddress(latitude, longitude);
  };

  const handleNext = () => {
    if (!region) {
      setLocationError("Select a valid incident location before continuing.");
      return;
    }

    const nextParams = {
      ...params,
      locationLat: region.latitude.toString(),
      locationLng: region.longitude.toString(),
      locationAddress: address,
    };

    if (isEditing) {
      router.push({
        pathname: "/reporting/Review",
        params: { ...nextParams, mode: "edit" },
      });
      return;
    }

    router.push({ pathname: "/reporting/UploadPhotos", params: nextParams });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.errorScreen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            Incident Location <Text style={styles.requiredMark}>*</Text>
          </Text>
          <Text style={styles.errorMessage}>{locationError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void requestCurrentLocation()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewWrapper style={styles.map} region={region}>
        <Marker coordinate={region} draggable onDragEnd={onMarkerDragEnd} />
      </MapViewWrapper>

      <SafeAreaView style={{ position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 16 }} pointerEvents="box-none">
        <BackButton onPress={() => router.back()} style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 }} />
      </SafeAreaView>

      <View style={[styles.addressBox, locationError && styles.errorBorder]}>
        <Text style={styles.label}>
          Incident Location <Text style={styles.requiredMark}>*</Text>
        </Text>
        <Text style={styles.address}>{address || "Resolving address..."}</Text>
        <Text style={styles.helperText}>Drag the marker to adjust the rescue location.</Text>
        {locationError ? <Text style={styles.inlineError}>{locationError}</Text> : null}
        {locationError ? (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.inlineRetryButton}
            onPress={() => void requestCurrentLocation()}
          >
            <Text style={styles.inlineRetryText}>Use current location again</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title={isEditing ? "Save Changes" : "Continue Report"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 15, color: "#333333" },
  errorScreen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FAFAFA",
  },
  errorCard: {
    padding: 22,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3D2D2",
    elevation: 2,
  },
  errorTitle: { color: "#333333", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  errorMessage: { color: "#B42318", fontSize: 14, lineHeight: 20 },
  retryButton: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5A623",
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  addressBox: {
    padding: 16,
    paddingBottom: 88,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#DDDDDD",
  },
  label: { fontSize: 14, fontWeight: "600", color: "#333333", marginBottom: 4 },
  requiredMark: { color: "#D32F2F", fontWeight: "700" },
  address: { fontSize: 16, color: "#333333" },
  helperText: { marginTop: 5, color: "#6B7280", fontSize: 12 },
  inlineError: { marginTop: 5, color: "#D32F2F", fontSize: 12 },
  inlineRetryButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  inlineRetryText: { color: "#8A4B08", fontSize: 13, fontWeight: "700" },
  errorBorder: { borderColor: "#D32F2F", borderWidth: 1.5 },
  bottomButtonWrapper: { position: "absolute", bottom: 25, left: 20, right: 20 },
});
