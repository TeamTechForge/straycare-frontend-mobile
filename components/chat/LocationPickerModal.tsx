import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapViewWrapper from "../MapViewWrapper";

const BRAND_COLOR = "#F5A623";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
};

export default function LocationPickerModal({ visible, onClose, onSelectLocation }: Props) {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState({
    latitude: 6.9271, // Default to Colombo
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // When modal opens, try to get current location to center map
  React.useEffect(() => {
    if (visible && !initialized) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            setRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        } catch (e) {
          // Ignore, just use default
        } finally {
          setInitialized(true);
        }
      })();
    }
  }, [visible, initialized]);

  const handleConfirm = async () => {
    setLoading(true);
    let address: string | undefined;
    try {
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      if (geocode) {
        address = [geocode.street, geocode.city, geocode.region].filter(Boolean).join(", ");
      }
    } catch (e) {
      // Ignore geocode error
    }

    setLoading(false);
    onSelectLocation({
      latitude: region.latitude,
      longitude: region.longitude,
      address,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Location</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapViewWrapper
            style={styles.map}
            region={region}
            onRegionChangeComplete={(newRegion: any) => setRegion(newRegion)}
          />
          {/* Static Center Pin */}
          <View style={styles.pinContainer} pointerEvents="none">
            <Ionicons name="location" size={40} color={BRAND_COLOR} />
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.helpText}>Drag the map to pinpoint your location</Text>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send this Location</Text>
            )}
          </TouchableOpacity>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20, // half of icon size
    marginTop: -40,  // full icon size to point at center
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: BRAND_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
