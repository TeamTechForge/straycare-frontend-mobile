import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function FileUploadField({ file, onPick }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPick}>
      <Ionicons name="cloud-upload-outline" size={24} color="#999" />
      <Text style={styles.text}>
        {file && typeof file === "object" && "name" in file
          ? file.name
          : file || "Tap to upload PDF or JPG"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  text: {
    marginTop: 5,
    color: "#888",
    fontSize: 12,
  },
});