import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function PayHereSetupGuideModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>PayHere Payment Setup</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close PayHere setup guide">
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Payment credentials</Text>
            <Text style={styles.step}>1. Sign in to PayHere Sandbox and open Integrations.</Text>
            <Text style={styles.step}>2. Copy your Merchant ID, add onrender.com as the website domain, and copy its Merchant Secret.</Text>

            <Text style={styles.sectionTitle}>Recurring donation credentials</Text>
            <Text style={styles.step}>1. Open Settings → API Keys and create an API key.</Text>
            <Text style={styles.step}>2. For sandbox testing, set Allowed Domains to *.</Text>
            <Text style={styles.step}>3. Enable Subscription Management API and Automatic Charging API.</Text>
            <Text style={styles.step}>4. Open View Credentials and copy the App ID and App Secret.</Text>

            <View style={styles.note}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#92400E" />
              <Text style={styles.noteText}>Merchant Secret and App Secret are different. Keep both private.</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", justifyContent: "center", padding: 22 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 20, maxHeight: "82%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { flex: 1, fontSize: 19, fontWeight: "800", color: "#2D211C" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#B45309", marginTop: 10, marginBottom: 7 },
  step: { fontSize: 13, lineHeight: 19, color: "#4B5563", marginBottom: 6 },
  note: { flexDirection: "row", gap: 8, backgroundColor: "#FFF7E6", borderRadius: 10, padding: 11, marginTop: 12 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: "#7A4A08" },
  doneButton: { backgroundColor: "#F5A623", minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 18 },
  doneText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
