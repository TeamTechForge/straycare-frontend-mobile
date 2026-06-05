import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import PrimaryButton from "../../components/PrimaryButton";

// -------------- TYPES --------------
type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function LocationPicker() {
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const params = useLocalSearchParams();

  // -------------- GET USER LOCATION --------------
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const initialRegion: MapRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(initialRegion);
      fetchAddress(latitude, longitude);
      setLoading(false);
    })();
  }, []);

  // -------------- REVERSE GEOCODE --------------
  const fetchAddress = async (lat: number, lng: number) => {
    const result = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (result.length > 0) {
      const item = result[0];
      const formatted =
        `${item.name || ""}, ${item.street || ""}, ${item.city || ""}, ${item.region || ""}`;
      setAddress(formatted || "Unknown location");
    } else {
      setAddress("Unknown location");
    }
  };

  // -------------- DRAG MARKER HANDLER --------------
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

  // -------------- CONTINUE BUTTON --------------
  const handleNext = () => {
    if (!region) return;

    router.push({
      pathname: "/reporting/upload-photos", // FIXED FLOW
      params: {
        ...params,
        locationLat: region.latitude.toString(),
        locationLng: region.longitude.toString(),
        locationAddress: address,
      },
    });
  };

  // -------------- LOADING UI --------------
  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  // -------------- MAIN UI --------------
  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker coordinate={region} draggable onDragEnd={onMarkerDragEnd} />
      </MapView>

      <View style={styles.addressBox}>
        <Text style={styles.label}>INCIDENT LOCATION</Text>
        <Text style={styles.address}>{address}</Text>
      </View>

      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton title="Continue Report →" onPress={handleNext} />
      </View>
    </View>
  );
}

// -------------- STYLES --------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  map: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  addressBox: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  label: { fontSize: 14, fontWeight: "600", color: "#444" },
  address: { fontSize: 16, marginTop: 4 },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
