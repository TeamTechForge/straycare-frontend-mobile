// This file decides which map component to use depending on the platform.
//
// Metro (the bundler) automatically picks the right file:
//   MapViewWrapper.native.tsx → loaded on iOS and Android devices
//   MapViewWrapper.web.tsx    → loaded when running in a browser
//
// This fallback file should not be loaded at runtime.
// It's here just in case Metro doesn't find a platform-specific file.

import * as React from "react";
import { View, Text } from "react-native";

// No-op Marker — screens that import { Marker } from MapViewWrapper won't break
export function Marker(_props: any) {
  return null;
}

// Common MapView props accepted by the wrapper so TypeScript is satisfied
// regardless of which platform file Metro resolves at runtime.
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialRegion: _initialRegion,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  region: _region,
  ..._rest
}: MapViewWrapperProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#eee",
          borderRadius: 12,
        },
        style,
      ]}
    >
      <Text>🗺️ Map placeholder</Text>
      {children}
    </View>
  );
}
