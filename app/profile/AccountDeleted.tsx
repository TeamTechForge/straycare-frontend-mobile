import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import PrimaryButton from "../../components/PrimaryButton";

import { useAuth } from "../../contexts/AuthContext";

export default function AccountDeletedScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleReturnWelcome = async () => {
    await logout();
    router.replace("/auth/Welcome");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleReturnWelcome}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* LOGO */}
      <View style={styles.logoBox}>
        <Image
          source={require("../../assets/images/straycarelogo.png")}
          style={styles.logo}
        />
      </View>

      {/* IMAGE CARD */}
      <View style={styles.imageCard}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=600&auto=format&fit=crop",
          }}
          style={styles.catImage}
        />
      </View>

      <Text style={styles.title}>Account Deleted</Text>

      <Text style={styles.description}>
        Your account has been successfully deleted. We're sorry to see you go.
      </Text>

      <View style={styles.buttonWrapper}>
        <PrimaryButton title="Return to Welcome Screen" onPress={handleReturnWelcome} />
      </View>

      <Text style={styles.footer}>🐾 StrayCare</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingTop: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoIcon: {
    fontSize: 38,
  },
  logoTitle: {
    color: "#D8892E",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  logoSub: {
    fontSize: 12,
    color: "#8C5B2C",
    fontWeight: "700",
  },
  imageCard: {
    alignSelf: "center",
    width: "88%",
    height: 210,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    marginBottom: 30,
  },
  catImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 14,
  },
  description: {
    textAlign: "center",
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginHorizontal: 30,
  },
  buttonWrapper: {
    marginTop: 38,
  },
  footer: {
    textAlign: "center",
    marginTop: 22,
    color: "#999",
    fontSize: 13,
  },
});