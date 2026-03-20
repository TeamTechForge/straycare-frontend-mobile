// components/RescueMap.web.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This file is automatically used ONLY when running on the web.
// It acts as a placeholder so the Metro bundler doesn't try to load the native map library.
export default function RescueMap() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ Interactive Map is only available on iOS/Android.</Text>
      <Text style={styles.subtext}>Please test using the Expo Go app or a mobile emulator.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  subtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  }
});