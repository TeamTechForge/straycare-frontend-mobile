// components/SearchingHelp/AcceptedState.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/searchingHelp.styles';

// 1. Define the dynamic properties including rescuerImage
interface AcceptedStateProps {
  rescuerName: string;
  type: string;
  distance: string;
  rescuerImage: string; // <--- ADD THIS INTERFACE LINE
  onViewTracking: () => void;
}

export default function AcceptedState({ rescuerName, type, distance, rescuerImage, onViewTracking }: AcceptedStateProps) {
  // Local state to handle image loading errors gracefully
  const [imageError, setImageError] = useState(false);
  
  // Static image for the animal case
  const dogImageUri = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150&h=150';

  // Calculate a rough ETA (assuming 2.5 minutes per km of distance)
  const numericDistance = parseFloat(distance) || 0;
  const estimatedMinutes = Math.max(1, Math.round(numericDistance * 2.5));

  // Professional fallback: If image fails, show an icon instead of a blank space
  const RescuerAvatar = () => {
    if (imageError || !rescuerImage) {
      return (
        <View style={[styles.rescuerAvatar, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={24} color="#aaa" />
        </View>
      );
    }
    return (
      <Image 
        source={{ uri: rescuerImage }} 
        style={styles.rescuerAvatar} 
        onError={() => setImageError(true)} // Handle potential broken links
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Request Accepted</Text>
      
      <View style={styles.resultContainer}>
        <View style={styles.bigIconWrapper}>
          <View style={styles.circleBackground}>
            <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
          </View>
        </View>

        <View style={styles.rescuerDetailCard}>
          <View style={styles.rescuerHeader}>
            {/* 2. Display the dynamic Avatar here! */}
            <RescuerAvatar />
            
            <View>
              {/* 3. Display the rest of the dynamic data! */}
              <Text style={styles.rescuerName}>{rescuerName}</Text>
              <Text style={styles.rescuerRole}>{type}</Text>
              <Text style={styles.rescuerAddress}>{distance} km away</Text>
            </View>
          </View>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={32} color="#ccc" />
          </View>
          <Text style={styles.etaText}>ETA : ~{estimatedMinutes} min</Text>
        </View>

        <Text style={styles.sectionLabel}>Rescue Case</Text>

        {/* Rescue Case Card (static for now) */}
        <View style={[styles.infoCard, { borderColor: 'transparent' }]}>
          <Image source={{ uri: dogImageUri }} style={styles.animalImage} />
          <View>
            <Text style={styles.infoCardText}>Animal : Injured Dog</Text>
            <Text style={styles.infoCardSubText}>Location : Near Main Street</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.fullWidthButton} onPress={onViewTracking}>
          <Text style={styles.buttonText}>View Live Tracking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}