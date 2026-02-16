import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function UploadPhotos() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [photos, setPhotos] = useState<string[]>([]);

  const addPlaceholderPhoto = () => {
    if (photos.length < 5) {
      setPhotos([...photos, "placeholder"]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Photos</Text>
      <Text style={styles.subtext}>Add up to 5 clear photos.</Text>

      <View style={styles.grid}>
        {photos.map((_, index) => (
          <View key={index} style={styles.photoBox}>
            <View style={styles.placeholderPhoto} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removePhoto(index)}
            >
              <Text style={{ color: "white" }}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < 5 && (
          <TouchableOpacity style={styles.addBox} onPress={addPlaceholderPhoto}>
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <PrimaryButton
        title="Next Step →"
        onPress={() =>
          router.push({
            pathname: "/reporting/permissions",
            params: { ...params, photos: JSON.stringify(photos) },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 10 },
  subtext: { fontSize: 14, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#eee",
    borderRadius: 10,
    position: "relative",
  },
  placeholderPhoto: {
    flex: 1,
    backgroundColor: "#ccc",
    borderRadius: 10,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "black",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addBox: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { fontSize: 12 },
});
