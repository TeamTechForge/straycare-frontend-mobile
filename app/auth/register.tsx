import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField"; // ✅ USING REUSABLE

const BRAND_COLOR = "#F5A623";

export default function RegisterScreen() {
  const [isChecked, setIsChecked] = useState(false);
  const params = useLocalSearchParams();
    
    useEffect(() => {
      if (params.agreed === "true") {
      setIsChecked(true);
      }
    }, [params.agreed]);

  const router = useRouter();

  const [agree, setAgree] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<any>({});

  
  const validateForm = () => {
    let newErrors: any = {};

    if (!name.trim()) newErrors.name = "Name is required";

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (phone.length < 10) {
      newErrors.phone = "Invalid phone number";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agree) {
      newErrors.terms = "You must accept terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        <Text style={styles.label}>Name</Text>
        <InputField
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}

        {/* EMAIL */}
        <Text style={styles.label}>Email Address</Text>
        <InputField
          placeholder="Johndoe@gmail.com"
          value={email}
          onChangeText={setEmail}
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        {/* PHONE */}
        <Text style={styles.label}>Phone Number</Text>
        <InputField
          placeholder="+94 77 555 5555"
          value={phone}
          onChangeText={setPhone}
        />
        {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>
        <InputField
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secure
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

        {/* CONFIRM PASSWORD */}
        <Text style={styles.label}>Confirm Password</Text>
        <InputField
          placeholder="********"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
        />
        {errors.confirmPassword && (
          <Text style={styles.error}>{errors.confirmPassword}</Text>
        )}

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
    <Text
      style={{ color: BRAND_COLOR }}
      onPress={() => router.push("/auth/termsPrivacyScreen")}
    >
      Terms & Privacy Policy
    </Text>
  </Text>
</TouchableOpacity>

{errors.terms && <Text style={styles.error}>{errors.terms}</Text>}
        {/* BUTTON */}
        <PrimaryButton
          title="Create Account"
          onPress={() => {
            if (validateForm()) {
              router.push("/auth/roleSelection");
            }
          }}
        />

        {/* OR */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* GOOGLE */}
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

        {/* LOGIN */}
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
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "500",
  },

  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 6,
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