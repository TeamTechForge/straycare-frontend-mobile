import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function UploadPhotos() {
  const router = useRouter();
  const params = useLocalSearchParams();


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Upload Photos</Text>
        <Text style={styles.subtext}>Add photos here.</Text>

        {/* big first image */}
        <View style={styles.mainPhotoBox}>
          <MaterialCommunityIcons name="image-outline" size={60} color="#bbb" />
        </View>

        {/* placeholder grid */}
        <View style={styles.grid}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.smallPhotoBox}>
              <MaterialCommunityIcons
                name="image-outline"
                size={35}
                color="#ccc"
              />
            </View>
          ))}

          {/* add */}
          <View style={styles.addBox}>
            <MaterialCommunityIcons name="plus" size={35} color="#777" />
          </View>
        </View>

        {/* camera button */}
        <TouchableOpacity style={styles.cameraButton}>
          <MaterialCommunityIcons name="camera" size={25} color="white" />
        </TouchableOpacity>
      </ScrollView>

      {/* navigation bottom button */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title="Next Step →"
          onPress={() =>
  router.push({
    pathname: "/reporting/permissions",
    params: { ...params }
  })
}

        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 160, 
  },

  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  subtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
  },

  // BIG PLACEHOLDER
  mainPhotoBox: {
    width: "100%",
    height: 220,
    backgroundColor: "#eee",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  // GRID
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 60,
  },

  smallPhotoBox: {
    width: 90,
    height: 90,
    backgroundColor: "#eee",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  addBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    backgroundColor: "#FFB700",
    width: 60,
    height: 60,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
