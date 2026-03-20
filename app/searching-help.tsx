// app/searching-help.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { styles } from '../styles/searchingHelp.styles';

export default function SearchingHelpScreen() {
  const { rescuerName, distance } = useLocalSearchParams();
  const finalName = rescuerName || "Embark Foundation";
  const finalDistance = distance || "5";

  // State to handle the step animation
  const [step, setStep] = useState(0);
  
  // State to handle the final result: 'searching', 'accepted', or 'rejected'
  const [requestStatus, setRequestStatus] = useState<'searching' | 'accepted' | 'rejected'>('searching');

  // Placeholder images
  const dogImageUri = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150&h=150';
  const avatarUri = 'https://randomuser.me/api/portraits/men/32.jpg';

  useEffect(() => {
    // Only run the timer if we are in the searching phase
    if (requestStatus === 'searching') {
      const timer1 = setTimeout(() => setStep(1), 1000);
      const timer2 = setTimeout(() => setStep(2), 2000);
      const timer3 = setTimeout(() => setStep(3), 3500);
      const timer4 = setTimeout(() => setStep(4), 5500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [requestStatus]);

  // Simulates the backend response
  const handleDonePress = () => {
    // Math.random() generates a number between 0 and 1. 
    // This gives a 50/50 chance of being accepted or rejected.
    const isAccepted = Math.random() >= 0.5;
    setRequestStatus(isAccepted ? 'accepted' : 'rejected');
  };

  // ------------------------------------------------------------------
  // VIEW 1: REJECTED SCREEN
  // ------------------------------------------------------------------
  if (requestStatus === 'rejected') {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Request Not Accepted</Text>
        
        <View style={styles.resultContainer}>
          <View style={styles.bigIconWrapper}>
            <Ionicons name="close-circle" size={120} color="#B7322B" />
          </View>
          
          <Text style={styles.resultSubtitle}>Your Request Not Accepted</Text>
          
          <View style={styles.infoCard}>
            <Image source={{ uri: dogImageUri }} style={styles.animalImage} />
            <Text style={styles.infoCardText}>Searching For Next Available Rescuer...</Text>
          </View>

          <TouchableOpacity style={styles.fullWidthButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 2: ACCEPTED SCREEN
  // ------------------------------------------------------------------
  if (requestStatus === 'accepted') {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Request Accepted</Text>
        
        <View style={styles.resultContainer}>
          <View style={styles.bigIconWrapper}>
            <View style={styles.circleBackground}>
              <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
            </View>
          </View>

          {/* Rescuer Detail Card */}
          <View style={styles.rescuerDetailCard}>
            <View style={styles.rescuerHeader}>
              <Image source={{ uri: avatarUri }} style={styles.rescuerAvatar} />
              <View>
                <Text style={styles.rescuerName}>Jhone Doe</Text>
                <Text style={styles.rescuerRole}>Rescuer</Text>
                <Text style={styles.rescuerAddress}>Bandaranayke Road</Text>
              </View>
            </View>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={32} color="#ccc" />
            </View>
            <Text style={styles.etaText}>ETA : 10min</Text>
          </View>

          <Text style={styles.sectionLabel}>Rescue Case</Text>

          {/* Rescue Case Card */}
          <View style={[styles.infoCard, { borderColor: 'transparent' }]}>
            <Image source={{ uri: dogImageUri }} style={styles.animalImage} />
            <View>
              <Text style={styles.infoCardText}>Animal : Injured Dog</Text>
              <Text style={styles.infoCardSubText}>Location : Near Main Street</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.fullWidthButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>View Live Tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 3: SEARCHING SCREEN (Default)
  // ------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Searching for Nearby Help</Text>

      <View style={styles.cardContainer}>
        {step >= 1 && (
          <View style={styles.statusBox}>
            <View style={styles.iconSquare}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
            <Text style={styles.statusText}>Found Nearest Rescuer</Text>
          </View>
        )}

        {step >= 2 && (
          <View style={[styles.statusBox, styles.distanceBox]}>
            <Text style={styles.distanceText}>Distance : {finalDistance}km</Text>
          </View>
        )}

        {step >= 3 && (
          <View style={styles.requestBox}>
            {step === 3 ? (
              <ActivityIndicator size="small" color="#F4A261" style={styles.spinner} />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="#F4A261" style={styles.spinner} />
            )}
            <Text style={styles.requestText}>Request sending to{"\n"}{finalName}</Text>
          </View>
        )}

        {step >= 4 && (
          <View style={styles.profileBox}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{finalName}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, step < 4 && styles.buttonDisabled]} 
            disabled={step < 4}
            onPress={handleDonePress} // Trigger the random response here!
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}