// This file is used on iOS and Android devices (loaded automatically by Metro).
//
// In Expo Go, native map packages often require a development build.
// To provide a seamless, high-fidelity experience without requiring native compilations,
// this wrapper displays a premium mock city street map as background,
// and projects GPS coordinates dynamically onto the screen using a linear scale.
//
// If you want a real MapView, build the app natively:
//   npx expo run:android
// Then you can replace this file's contents with:
//   import MapView, { Marker } from "react-native-maps";
//   export { Marker };
//   export default function MapViewWrapper(props) {
//     return <MapView {...props}>{props.children}</MapView>;
//   }

import * as React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors.constants";
import { typography } from "../constants/typography.constants";

// ── Map Bounding Box Context ───────────────────────────────────────────────
// Used to pass projection parameters from the map wrapper down to the markers.
interface MapContextType {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const MapContext = React.createContext<MapContextType>({
  minLat: 6.9121,
  maxLat: 6.9421,
  minLng: 79.8462,
  maxLng: 79.8762,
});

// ── Map Marker Component ────────────────────────────────────────────────────
// Projects coordinate (latitude/longitude) to relative percentages.
export function Marker({ coordinate, title, description, pinColor }: any) {
  const { minLat, maxLat, minLng, maxLng } = React.useContext(MapContext);
  if (!coordinate) return null;
  const { latitude, longitude } = coordinate;

  // Linear projection (x: longitude, y: latitude)
  const pctX = ((longitude - minLng) / (maxLng - minLng)) * 100;
  const pctY = ((maxLat - latitude) / (maxLat - minLat)) * 100;

  // Clamp projection to stay safely inside container bounds
  const left = Math.max(8, Math.min(92, pctX));
  const top = Math.max(8, Math.min(92, pctY));

  // Determine indicator styles
  const markerColor = pinColor || colors.primary || "#FEB94B";
  const isUser = title?.toLowerCase().includes("reporter") || title?.toLowerCase().includes("you");
  const emoji = isUser ? "👤" : "🚑";

  return (
    <View style={[styles.markerContainer, { left: `${left}%`, top: `${top}%` }]}>
      {/* Tooltip containing marker info */}
      <View style={[styles.tooltip, { borderColor: `${markerColor}66` }]}>
        <Text style={styles.tooltipTitle}>{title || "Location"}</Text>
        {description ? (
          <Text style={styles.tooltipDesc} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>

      {/* Pulsing ring indicator */}
      <View style={[styles.pulseCircle, { backgroundColor: markerColor }]} />

      {/* Marker center dot */}
      <View style={[styles.markerPin, { backgroundColor: markerColor }]}>
        <Text style={styles.markerEmoji}>{emoji}</Text>
      </View>
    </View>
  );
}

// ── Bounding box coordinates wrapper ──────────────────────────────────────
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewWrapperProps {
  style?: any;
  children?: React.ReactNode;
  /** Initial visible map region (matches react-native-maps API) */
  initialRegion?: Region;
  /** Current visible region (controlled) */
  region?: Region;
  /** Any other props forwarded to the underlying map view */
  [key: string]: any;
}

export default function MapViewWrapper({
  style,
  children,
  initialRegion,
  region,
  ..._rest
}: MapViewWrapperProps) {
  // Determine center coordinates and span
  const mapRegion = region ?? initialRegion ?? {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  const centerLat = mapRegion.latitude;
  const centerLng = mapRegion.longitude;
  const latDelta = mapRegion.latitudeDelta;
  const lngDelta = mapRegion.longitudeDelta;

  const minLat = centerLat - latDelta / 2;
  const maxLat = centerLat + latDelta / 2;
  const minLng = centerLng - lngDelta / 2;
  const maxLng = centerLng + lngDelta / 2;

  return (
    <MapContext.Provider value={{ minLat, maxLat, minLng, maxLng }}>
      <ImageBackground
        source={require("../assets/images/mock-map.jpg")}
        style={[styles.container, style]}
        imageStyle={styles.backgroundImage}
      >
        {/* Render child markers */}
        {children}

        {/* Premium badge overlay */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Map Preview</Text>
        </View>
      </ImageBackground>
    </MapContext.Provider>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    position: "relative",
    backgroundColor: "#E8F0FE",
  },
  backgroundImage: {
    borderRadius: 12,
    resizeMode: "cover",
  },

  // ── Marker styling ──
  markerContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 99,
  },
  markerPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 12,
  },
  pulseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: "absolute",
    opacity: 0.25,
  },

  // ── Tooltip popup ──
  tooltip: {
    backgroundColor: "rgba(17, 17, 17, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: "absolute",
    bottom: 36,
    alignItems: "center",
    minWidth: 80,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tooltipTitle: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: typography.bold,
    textAlign: "center",
  },
  tooltipDesc: {
    color: "#D1D5DB",
    fontSize: 8,
    fontFamily: typography.regular,
    marginTop: 1,
    textAlign: "center",
  },

  // ── Live indicator badge ──
  liveBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981", // active green
  },
  liveText: {
    fontSize: 9,
    fontFamily: typography.bold,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
