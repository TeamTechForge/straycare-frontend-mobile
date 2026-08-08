// This file is used when the app runs in a web browser (loaded automatically by Metro).
// react-native-maps cannot run on the web natively without web commands, so we render a web preview container.

import React from "react";
import { View, Text } from "react-native";

export function Marker(_props: any) {
  return null;
}

export function Callout(_props: any) {
  return null;
}

export function Polyline(_props: any) {
  return null;
}

export function Circle(_props: any) {
  return null;
}

export const PROVIDER_GOOGLE = "google";

const MapViewWrapper = React.forwardRef<any, { style?: any; children?: React.ReactNode }>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    fitToCoordinates: () => {},
    animateToRegion: () => {},
    fitToElements: () => {},
  }));

  return (
    <View
      style={[
        {
          width: "100%",
          height: 300,
          backgroundColor: "#E8F0FE",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#CBD5E1",
        },
        props.style,
      ]}
    >
      <Text style={{ fontSize: 28 }}>🗺️</Text>
      <Text style={{ color: "#334155", marginTop: 8, fontWeight: "700", fontSize: 14 }}>
        Interactive Map View
      </Text>
      <Text style={{ color: "#64748B", marginTop: 2, fontSize: 12 }}>
        (Mobile Device view active)
      </Text>
      {props.children}
    </View>
  );
});

export default MapViewWrapper;
