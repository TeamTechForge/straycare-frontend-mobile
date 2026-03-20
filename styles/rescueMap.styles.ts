import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    padding: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  distance: {
    fontSize: 14,
    color: '#E63946',
    fontWeight: '700',
  },
  requestButton: {
    marginTop: 8,
    backgroundColor: '#F4B445',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  requestButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  }
});