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
  };
  onProfilePress: () => void;
  onAdoptionPress: () => void;
  onDonationsPress: () => void;
  onSettingsPress: () => void;
  onLogoutPress: () => void;
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
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />

        <View style={styles.sideMenu}>
          <View style={styles.menuProfileTop}>
            <View style={styles.menuAvatarWrap}>
              <Image source={{ uri: user.avatar }} style={styles.menuAvatar} />
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.menuName}>{user.name}</Text>

            <View style={styles.menuMemberPill}>
              <Text style={styles.menuMemberPillText}>MEMBER</Text>
            </View>

            <TouchableOpacity onPress={onProfilePress}>
              <Text style={styles.viewProfileLink}>View Profile &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
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
  menuProfileTop: {
    backgroundColor: "#F8F1E5",
    borderRadius: 14,
    padding: 14,
  },
  menuAvatarWrap: {
    position: "relative",
    width: 50,
    height: 50,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1EC66B",
    borderWidth: 2,
    borderColor: "#fff",
  },
  menuName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  menuMemberPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  menuMemberPillText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
  viewProfileLink: {
    marginTop: 8,
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: "600",
  },
  menuItems: {
    marginTop: 10,
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