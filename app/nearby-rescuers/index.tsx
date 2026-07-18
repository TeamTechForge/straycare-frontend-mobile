
import { useEffect, useRef, useState } from "react";
import { Alert, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import * as Location from "expo-location";
import { router } from "expo-router";

// Type for storing the user's location
type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function NearbyRescuersScreen() {
  const [coords, setCoords] = useState<Coordinates | null>(null); // user's GPS position
  const [loading, setLoading] = useState(true);

  // useRef prevents the location request from running twice in React strict mode
  const hasRequestedLocation = useRef(false);

  useEffect(() => {
    // Skip if we already requested location (prevents duplicate calls)
    if (hasRequestedLocation.current) return;
    hasRequestedLocation.current = true;

    const getLocation = async () => {
      try {
        console.log("[NearbyRescuers] Requesting foreground location permission");

        // Ask the user to allow location access
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert("Location permission is required");
          return;
        }

        // Get the current GPS position
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const nextCoords: Coordinates = { latitude, longitude };

        console.log("[NearbyRescuers] Current location:", nextCoords);
        setCoords(nextCoords);

        // Navigate to the next screen and pass the coordinates as URL params
        router.replace({
          pathname: "/searching-help",
          params: {
            lat: String(latitude),
            lng: String(longitude),
          },
        } as never);
      } catch (error) {
        console.error("[NearbyRescuers] Failed to get location:", error);
        Alert.alert("Unable to get your location", "Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void getLocation();
  }, []);

  // Show a spinner while waiting for location
  if (loading || !coords) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E86DE" />
        <Text style={styles.loading}>Getting your location...</Text>
      </View>
    );
  }

  // Once we have coordinates, show the map with the user's position marked
  return (
    <MapViewWrapper
      style={styles.map}
      initialRegion={{
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,  // how zoomed in the map is 
        longitudeDelta: 0.05,
      }}
    >
      {/* Blue pin showing "You are here" */}
      <Marker coordinate={coords} title="You" pinColor="blue" />
    </MapViewWrapper>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 }, // map takes up the full screen
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
});
