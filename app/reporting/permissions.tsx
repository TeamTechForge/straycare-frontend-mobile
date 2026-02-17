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

export default function Permissions() {
  const router = useRouter();
  const params = useLocalSearchParams();


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Permissions Needed</Text>
        <Text style={styles.subtext}>
          To continue, we need access to your location.
        </Text>

        {/* permission note */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="map-marker"
              size={40}
              color="#FFB700"
            />
          </View>

          <Text style={styles.cardTitle}>Location Access</Text>

        
          <Text style={styles.cardTextBig}>
            We use your location to identify where the stray animal was found.
            This helps rescuers reach the correct spot quickly and safely.
          </Text>
        </View>

        {/* skip for now  */}
        <TouchableOpacity onPress={() => router.push("/reporting/upload-photos")}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>

{/* navigation bottom button */}
<View style={styles.bottomButtonWrapper}>
  <PrimaryButton
    title="Allow Access"
    onPress={() =>
      router.push({
        pathname: "/reporting/location",
        params: { ...params },
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
    marginBottom: 6,
  },

  subtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },

  // CARD
  card: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF4D1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

 
  cardTextBig: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 4,
  },

  skipText: {
    marginTop: 10,
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
