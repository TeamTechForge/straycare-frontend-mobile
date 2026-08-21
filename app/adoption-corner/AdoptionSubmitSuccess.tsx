import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function AdoptionSubmitSuccess() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={90} color="#F5A623" />
        </View>

        <Text style={styles.title}>Post Created!</Text>

        <Text style={styles.message}>
          Your adoption post has been submitted successfully and is now visible in Adoption Corner.
        </Text>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Back to Adoption Corner"
            onPress={() => router.replace("/adoption-corner")}
          />

          <PrimaryButton
            title="View My Posts"
            variant="outline"
            onPress={() => router.replace("/adoption-corner/MyPosts")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFF7E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#062425",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: "#717878",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 8,
  },
});
