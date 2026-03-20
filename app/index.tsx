// app/index.jsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import ActivitiesDiscussionScreen from "../screens/ActivitiesDiscussionScreen";

export default function Index() {
  return (
    <View style={styles.container}>
      {/* Navigation Bar / Button to access the map */}
      <View style={styles.navHeader}>
        <Link href="/nearby-rescuers" style={styles.button}>
          <Text style={styles.buttonText}>📍 Find Nearby Rescuers</Text>
        </Link>
      </View>

      {/* Your existing main screen content */}
      <View style={styles.content}>
        <ActivitiesDiscussionScreen />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navHeader: {
    paddingTop: 50, // To clear the phone's status bar/notch
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
    zIndex: 10, // Ensures it stays on top
  },
  button: {
    backgroundColor: '#E63946',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    overflow: 'hidden', // Required for Link styles on some devices
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1, // Ensures your ActivitiesDiscussionScreen takes up the rest of the space
  },
});