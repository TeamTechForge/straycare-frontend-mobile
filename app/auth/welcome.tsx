import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/straycarelogo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to StrayCare</Text>

      <PrimaryButton
        title="Create Account"
        onPress={() => router.push("/auth/register")}
      />
      <PrimaryButton
        title="Login"
        onPress={() => router.push("/auth/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:"center", alignItems:"center", padding:20 },
  logo: { width:150, height:150, marginBottom:20, resizeMode:"contain" },
  title: { fontSize:24, fontWeight:"bold", marginBottom:30, textAlign:"center" }
});
