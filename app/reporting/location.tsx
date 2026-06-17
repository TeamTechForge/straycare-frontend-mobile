import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import PrimaryButton from "../../components/PrimaryButton";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function LocationPicker() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ---------------------------------------------------------
  // SAFE PARAM FIX
  // ---------------------------------------------------------
  const safe = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v[0] : v || "";


  // ---------------------------------------------------------
  // EDIT MODE
  // ---------------------------------------------------------
  const isEditing = safe(params.mode) === "edit";

  const [region, setRegion] = useState<MapRegion | null>(null);
  const [address, setAddress] = useState(safe(params.locationAddress));
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // LOAD INITIAL LOCATION
  // ---------------------------------------------------------
  useEffect(() => {
    (async () => {
      // If editing → use existing location
      if (isEditing && params.locationLat && params.locationLng) {
        const lat = Number(safe(params.locationLat));
        const lng = Number(safe(params.locationLng));

        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        fetchAddress(lat, lng);
        setLoading(false);
        return;
      }

      // Normal flow → get current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      fetchAddress(latitude, longitude);
      setLoading(false);
    })();
  }, []);

  // ---------------------------------------------------------
  // REVERSE GEOCODE
  // ---------------------------------------------------------
  const fetchAddress = async (lat: number, lng: number) => {
    const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });

    if (result.length > 0) {
      const item = result[0];
      const formatted = `${item.name || ""}, ${item.street || ""}, ${item.city || ""}, ${item.region || ""}`;
      setAddress(formatted || "Unknown location");
    } else {
      setAddress("Unknown location");
    }
  };

  // ---------------------------------------------------------
  // MARKER DRAG
  // ---------------------------------------------------------
  const onMarkerDragEnd = (e: any) => {
    if (!region) return;

    const { latitude, longitude } = e.nativeEvent.coordinate;

    setRegion({
      ...region,
      latitude,
      longitude,
    });

    fetchAddress(latitude, longitude);
  };

  // ---------------------------------------------------------
  // NEXT / SAVE CHANGES
  // ---------------------------------------------------------
  const handleNext = () => {
    if (!region) return;

    // 🔥 EDIT MODE → return to Review
    if (isEditing) {
      router.push({
        pathname: "/reporting/review",
        params: {
          ...params,
          mode: "edit",
          locationLat: region.latitude.toString(),
          locationLng: region.longitude.toString(),
          locationAddress: address,
        },
      });
      return;
    }

    // 🔥 NORMAL FLOW → go to Upload Photos
    router.push({
      pathname: "/reporting/upload-photos",
      params: {
        ...params,
        locationLat: region.latitude.toString(),
        locationLng: region.longitude.toString(),
        locationAddress: address,
      },
    });
  };

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------
  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker coordinate={region} draggable onDragEnd={onMarkerDragEnd} />
      </MapView>

      {/* ADDRESS BOX */}
      <View style={styles.addressBox}>
        <Text style={styles.label}>Incident Location</Text>
        <Text style={styles.address}>{address}</Text>
      </View>

      {/* BUTTON */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title={isEditing ? "Save Changes →" : "Continue Report →"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  map: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#333",
  },

  addressBox: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },

  address: {
    fontSize: 16,
    color: "#333",
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
` `