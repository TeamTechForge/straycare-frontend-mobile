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

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewWrapperProps {
  style?: any;
  children?: React.ReactNode;
  initialRegion?: Region;
  region?: Region;
  [key: string]: any;
}

const MapViewWrapper = React.forwardRef<any, MapViewWrapperProps>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    fitToCoordinates: () => {},
    animateToRegion: () => {},
    fitToElements: () => {},
  }));

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
        props.style,
      ]}
    >
      <Text>🗺️ Map</Text>
      {props.children}
    </View>
  );
});

export default MapViewWrapper;
