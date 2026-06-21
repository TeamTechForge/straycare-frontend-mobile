import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  imageUri: string | null;
  onPress: () => void;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function ProfileImageUpload({
  imageUri,
  onPress,
  label = "Upload profile photo",
  icon = "person-outline",
}: Props) {
  return (
    <View style={styles.imageSection}>
      <View style={styles.avatarWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name={icon}
              size={34}
              color={BRAND_COLOR}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.editIcon}
          onPress={onPress}
        >
          <Ionicons
            name="camera-outline"
            size={14}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.uploadText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatarPlaceholder: {
    width: 95,
    height: 95,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: BRAND_COLOR,
    borderStyle: "dashed",
    backgroundColor: "#FFF9F0",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: 95,
    height: 95,
    borderRadius: 48,
  },

  editIcon: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },

  uploadText: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
  },
});