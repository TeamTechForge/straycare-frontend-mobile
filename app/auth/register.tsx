import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

const BRAND_COLOR = "#F5A623";

export default function RegisterScreen() {
  const router = useRouter();

  const [agree, setAgree] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* TOP IMAGE */}
      <Image
        source={require("../../assets/images/signupimg.jpg")}
        style={styles.topImage}
      />

      {/* CARD */}
      <View style={styles.card}>

        <Text style={styles.title}>
          Create your StrayCare account
        </Text>

        <Text style={styles.subtitle}>
          Join our community and help save lives
        </Text>

        {/* NAME */}
        <InputField
          icon={<Feather name="user" size={18} color="#777" />}
          placeholder="John Doe"
          label="Name"
        />

        {/*  EMAIL */}
        <InputField
          icon={<Feather name="mail" size={18} color="#777" />}
          placeholder="Johndoe@gmail.com"
          label="Email Address"
        />

        {/* PHONE */}
        <InputField
          icon={<Feather name="phone" size={18} color="#777" />}
          placeholder="+94 77 555 5555"
          label="Phone Number"
        />

        {/* PASSWORD */}
        <InputField
          icon={<Feather name="lock" size={18} color="#777" />}
          placeholder="********"
          label="Password"
          secure
        />

        {/*  CONFIRM PASSWORD */}
        <InputField
          icon={<Feather name="lock" size={18} color="#777" />}
          placeholder="********"
          label="Confirm Password"
          secure
        />

        {/* TERMS */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAgree(!agree)}
        >
          <Ionicons
            name={agree ? "checkbox" : "square-outline"}
            size={20}
            color={agree ? BRAND_COLOR : "#999"}
          />
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={{ color: BRAND_COLOR }}>
              Terms & Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>

        {/* CREATE BUTTON */}
        <PrimaryButton
          title="Create Account"
          onPress={() => router.push("/home")}
        />

        {/* OR DIVIDER */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/*  GOOGLE BUTTON */}
        <TouchableOpacity style={styles.googleButton}>
          <MaterialCommunityIcons
            name="google"
            size={18}
            color="#DB4437"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.googleText}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* LOGIN LINK */}
        <View style={styles.loginContainer}>
          <Text style={{ fontSize: 13 }}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginText}> Log in</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

/* Reusable Input Component */
function InputField({ icon, placeholder, label, secure }: any) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        {icon}
        <TextInput
          placeholder={placeholder}
          secureTextEntry={secure}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  topImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 25,
  },

  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#FAFAFA",
  },

  input: {
    marginLeft: 10,
    flex: 1,
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  termsText: {
    fontSize: 13,
    marginLeft: 8,
    color: "#444",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  orText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: "#999",
  },

  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  googleText: {
    fontWeight: "500",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: BRAND_COLOR,
    fontWeight: "600",
  },
});
