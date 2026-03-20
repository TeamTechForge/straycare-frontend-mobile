import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/searchingHelp.styles';

interface RejectedStateProps {
  onClose: () => void;
}

export default function RejectedState({ onClose }: RejectedStateProps) {
  const dogImageUri = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150&h=150';

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

        <TouchableOpacity style={styles.fullWidthButton} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}