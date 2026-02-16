import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <PrimaryButton
        title="Login"
        onPress={() => {
          // later connect API
          router.push("/home");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:"center", padding:20 },
  title: { fontSize:24, fontWeight:"bold", marginBottom:20, textAlign:"center" },
  input: {
    borderWidth:1,
    borderColor:"#ccc",
    borderRadius:8,
    padding:12,
    marginBottom:15
  }
});
