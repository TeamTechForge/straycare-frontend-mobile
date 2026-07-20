import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ProfileMenuItem from "./ProfileMenuItem";

const BRAND_COLOR = "#F5A623";

type Props = {
  visible: boolean;
  onClose: () => void;
  user: {
    name: string;
    avatar: string;
    role?: string;
    status?: string;
  };
  onProfilePress: () => void;
  onAdoptionPress: () => void;
  onDonationsPress: () => void;
  onSettingsPress: () => void;
  onLogoutPress: () => void;
  onNearbyReportsPress?: () => void;
  onMapViewPress?: () => void;
};

export default function ProfileMenuDrawer({
  visible,
  onClose,
  user,
  onProfilePress,
  onAdoptionPress,
  onDonationsPress,
  onSettingsPress,
  onLogoutPress,
  onNearbyReportsPress,
  onMapViewPress,
}: Props) {
  const isNGOorVet = user.role === 'ngo' || user.role === 'vet';
  const isUnapproved = isNGOorVet && user.status !== 'verified';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />
        <View style={styles.sideMenu}>
          <View style={styles.menuItems}>
            <View style={{ height: 20 }} />
            <ProfileMenuItem icon="person-outline" label="My Profile" onPress={onProfilePress} />
            <ProfileMenuItem icon="paw-outline" label="Adoption Corner" onPress={onAdoptionPress} />
            <ProfileMenuItem icon="card-outline" label="Donations" onPress={onDonationsPress} />
            <ProfileMenuItem icon="settings-outline" label="Settings" onPress={onSettingsPress} />

          </View>
          <TouchableOpacity style={styles.logoutRow} onPress={onLogoutPress}>
            <MaterialCommunityIcons name="logout" size={16} color="#FF5A5A" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>STRAYCARE V1.4.0</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  overlayTouch: {
    flex: 1,
  },
  sideMenu: {
    width: 280,
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: -2, height: 0 },
    elevation: 8,
  },
  menuItems: {
    marginTop: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAA",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  logoutText: {
    color: "#FF5A5A",
    fontSize: 13,
    fontWeight: "600",
  },
  versionText: {
    marginTop: 20,
    fontSize: 9,
    color: "#AAA",
    textAlign: "center",
  },
});