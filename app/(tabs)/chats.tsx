import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Chat Tab Placeholder
 * This screen will be developed in a later phase.
 */
export default function ChatsPlaceholder() {
  return (
    <View style={styles.container}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Your conversations will appear here soon.</Text>
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
