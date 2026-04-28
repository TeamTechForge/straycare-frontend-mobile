import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import PrimaryButton from "../../components/PrimaryButton";


type MapRegion = {     // Represents the map viewport region including center coordinates and zoom level
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function LocationPicker() {
  //  STATE 
  const [region, setRegion] = useState<MapRegion | null>(null);     // Map center + zoom
  const [address, setAddress] = useState("");                       // readable address
  const [loading, setLoading] = useState(true);                     // Loading state for location fetch

  const router = useRouter();
  const params = useLocalSearchParams();                            // Data passed from AnimalDetails screen

  
  useEffect(() => {
    (async () => {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      // Get current GPS location
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Set initial map region
      const initialRegion: MapRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(initialRegion);

      // Fetch readable address
      fetchAddress(latitude, longitude);

      setLoading(false);
    })();
  }, []);

 // Converts latitude + longitude into a readable address. Uses Expo's reverse geocoding API.
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

   // Triggered when the user drags the map marker.
  const onMarkerDragEnd = (e: any) => {
    if (!region) return;

    const { latitude, longitude } = e.nativeEvent.coordinate;

    // Update map region
    setRegion({
      ...region,
      latitude,
      longitude,
    });

    // Fetch new address
    fetchAddress(latitude, longitude);
  };

 
   // Navigates to the Upload Photos screen passing animal details from previous screen,selected location (lat, lng, address)
  
  const handleNext = () => {
    if (!region) return;

    router.push({
      pathname: "/reporting/upload-photos",
      params: {
        ...params,     // animalType, breed, category, notes, anonymous
        locationLat: region.latitude.toString(),
        locationLng: region.longitude.toString(),
        locationAddress: address,
      },
    });
  };

  //  LOADING UI 
  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  //  MAIN UI 
  return (
    <View style={styles.container}>
      {/* Map with draggable marker */}
      <MapView style={styles.map} region={region}>
        <Marker coordinate={region} draggable onDragEnd={onMarkerDragEnd} />
      </MapView>

      {/* Address display */}
      <View style={styles.addressBox}>
        <Text style={styles.label}>INCIDENT LOCATION</Text>
        <Text style={styles.address}>{address}</Text>
      </View>

      {/* Continue button */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton title="Continue Report →" onPress={handleNext} />
      </View>
    </View>
  );
}

//  STYLES 
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
