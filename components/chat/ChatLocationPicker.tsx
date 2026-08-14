import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapViewWrapper, { Marker } from "../MapViewWrapper";
import PrimaryButton from "../PrimaryButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = {
  visible: boolean;
  onSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  onCancel: () => void;
};

export default function ChatLocationPicker({ visible, onSelect, onCancel }: Props) {
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [address, setAddress] = useState("Getting address...");
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && !region) {
      loadInitialLocation();
    }
  }, [visible]);

  const loadInitialLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required to choose a location.");
      onCancel();
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      await fetchAddress(latitude, longitude);
    } catch (err) {
      Alert.alert("Error", "Could not get your current location.");
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    setAddress("Getting address...");
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const item = result[0];
        const formatted = [item.name, item.street, item.city, item.region]
          .filter(Boolean)
          .join(", ");
        setAddress(formatted || "Unknown location");
      } else {
        setAddress("Unknown location");
      }
    } catch {
      setAddress("Unknown location");
    }
  };

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

  const handleSend = () => {
    if (!region) return;
    onSelect({
      latitude: region.latitude,
      longitude: region.longitude,
      address,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading || !region ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <>
            <View style={styles.mapContainer}>
              <MapViewWrapper style={styles.map} region={region}>
                <Marker coordinate={region} draggable onDragEnd={onMarkerDragEnd} />
              </MapViewWrapper>
              
              {/* Overlay Tip */}
              <View style={styles.tipOverlay}>
                <Text style={styles.tipText}>Drag the pin to adjust the location</Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.addressBox}>
                <Text style={styles.label}>Selected Location</Text>
                <Text style={styles.address}>{address}</Text>
              </View>

              <PrimaryButton title="Send Location" onPress={handleSend} />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  tipOverlay: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },
  bottomContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  addressBox: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },
});
