import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { calculateDistance } from '../utils/distance';
import { router } from 'expo-router';
import { styles } from '../styles/rescueMap.styles';

interface Rescuer {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  image?: string; // ✅ add this line (optional)
}

interface RescueMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  rescuers: Rescuer[];
}

export default function RescueMap({ userLocation, rescuers }: RescueMapProps) {
  if (!userLocation) return null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
      >
        {rescuers.map((rescuer) => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            rescuer.latitude,
            rescuer.longitude
          );

          return (
            <Marker
              key={rescuer.id}
              coordinate={{ latitude: rescuer.latitude, longitude: rescuer.longitude }}
              pinColor={rescuer.type === 'NGO' ? 'blue' : 'red'}
            >
              


<Callout 
  tooltip={false} 
  onPress={() => {
    // Check if image exists before passing, provide fallback if not
    const imageToPass = rescuer.image || 'https://via.placeholder.com/150';

    router.push({
      pathname: '/searching-help',
      params: {
        rescuerName: rescuer.name,
        type: rescuer.type,
        distance: distance.toString(),
        rescuerImage: imageToPass, // <--- ADD THIS LINE
      }
    });
  }}
>
                  <View style={styles.calloutContainer}>
                  <Text style={styles.name}>{rescuer.name}</Text>
                  <Text style={styles.type}>{rescuer.type}</Text>
                  <Text style={styles.distance}>{distance} km away</Text>
                  
                  <View style={styles.requestButton}>
                    <Text style={styles.requestButtonText}>Request Help</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}