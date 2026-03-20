// styles/searchingHelp.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // --- Shared Styles ---
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#000',
  },
  
  // --- Step 1: Searching UI ---
  cardContainer: {
    backgroundColor: '#FDF7EC',
    borderRadius: 20,
    padding: 20,
    paddingTop: 30,
    minHeight: 450,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8E8D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  iconSquare: {
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  distanceBox: {
    backgroundColor: '#F8E8D0',
    paddingVertical: 14,
  },
  distanceText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  requestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF7EC',
    borderWidth: 1,
    borderColor: '#F4A261',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  spinner: {
    marginRight: 12,
  },
  requestText: {
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  actionButton: {
    backgroundColor: '#F4B445',
    paddingVertical: 14,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },

  // --- Step 2: Result UI (Accepted / Rejected) ---
  resultContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bigIconWrapper: {
    marginVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FDF7EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  
  // Animal / Info Cards
  infoCard: {
    backgroundColor: '#FDF7EC',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F4B445',
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  infoCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  infoCardSubText: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },

  // Rescuer Specific Card
  rescuerDetailCard: {
    backgroundColor: '#FDF7EC',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  rescuerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rescuerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  rescuerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  rescuerRole: {
    fontSize: 13,
    color: '#666',
  },
  rescuerAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  mapPlaceholder: {
    height: 80,
    backgroundColor: '#EBEBEB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  etaText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },

  // Bottom Buttons for Results
  fullWidthButton: {
    backgroundColor: '#F4B445',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
});