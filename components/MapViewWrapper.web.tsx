// This file is used when the app runs in a web browser (loaded automatically by Metro).
// react-native-maps cannot run on the web, so we show a simple placeholder instead.
// The Marker component is a no-op (does nothing) so screens don't crash when they use it.

import * as React from "react";
import { View, Text } from "react-native";

// No-op Marker — needed so screens can import { Marker } without getting an error
export function Marker(_props: any) {
  return null;
}

export default function MapViewWrapper({ style }: { style?: any }) {
  return (
    <View
      style={[
        {
          width: "100%",
          height: 300,
          backgroundColor: "#f0f0f0",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 12,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 24 }}>🗺️</Text>
      <Text style={{ color: "#555", marginTop: 8, fontWeight: "600" }}>
        Map not available on Web
      </Text>
    </View>
  );
}
