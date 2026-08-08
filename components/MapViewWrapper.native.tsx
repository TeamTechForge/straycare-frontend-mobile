// This file is loaded automatically by Metro on iOS and Android devices.
// It renders the real native MapView from react-native-maps.

import React from "react";
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Polyline, Circle } from "react-native-maps";

export { Marker, PROVIDER_GOOGLE, Callout, Polyline, Circle };

const MapViewWrapper = React.forwardRef<MapView, any>((props, ref) => {
  return (
    <MapView ref={ref} {...props}>
      {props.children}
    </MapView>
  );
});

export default MapViewWrapper;
