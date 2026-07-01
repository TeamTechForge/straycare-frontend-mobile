import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Community Feed Tab Placeholder
 * Another team member is responsible for this feature.
 */
export default function CommunityFeedPlaceholder() {
  return (
    <View style={styles.container}>
      <Ionicons name="people-outline" size={80} color="#ccc" />
      <Text style={styles.title}>Community Feed</Text>
      <Text style={styles.subtitle}>Connect with other stray animal rescuers soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});
