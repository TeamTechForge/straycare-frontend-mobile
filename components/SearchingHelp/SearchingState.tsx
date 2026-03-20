import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/searchingHelp.styles';

interface SearchingStateProps {
  rescuerName: string;
  distance: string;
  onCancel: () => void;
  onDone: () => void;
}

export default function SearchingState({ rescuerName, distance, onCancel, onDone }: SearchingStateProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
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
  }, []);

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
            <Text style={styles.distanceText}>Distance : {distance}km</Text>
          </View>
        )}

        {step >= 3 && (
          <View style={styles.requestBox}>
            {step === 3 ? (
              <ActivityIndicator size="small" color="#F4A261" style={styles.spinner} />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="#F4A261" style={styles.spinner} />
            )}
            <Text style={styles.requestText}>Request sending to{"\n"}{rescuerName}</Text>
          </View>
        )}

        {step >= 4 && (
          <View style={styles.profileBox}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{rescuerName}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, step < 4 && styles.buttonDisabled]} 
            disabled={step < 4}
            onPress={onDone}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}