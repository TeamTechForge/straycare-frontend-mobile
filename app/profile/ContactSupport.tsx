import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import { API_URL } from "../../constants/config.constants";

/**
 * ContactSupportScreen
 * Purpose: Allows users to submit support requests to the StrayCare team.
 * Features: Auto-fills user details from API, validates input, and handles submission.
 */

const BRAND_COLOR = "#F5A623";

export default function ContactSupportScreen() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    subject: "",
    message: "",
  });

  // Auto-fill user details from GET /auth/me
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (!token) return;

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data: any = await response.json();
          setName(data.name || "");
          setEmail(data.email || "");
        }
      } catch (error) {
        console.error("Failed to fetch user data for contact form:", error);
      }
    };

    fetchUserData();
  }, []);

  const validate = () => {
    let valid = true;
    const newErrors = { subject: "", message: "" };

    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
      valid = false;
    }

    if (!message.trim()) {
      newErrors.message = "Message cannot be empty";
      valid = false;
    } else if (message.trim().length < 10) {
      newErrors.message = "Please provide more details (min 10 chars)";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      /**
       * TODO: Backend API Integration
       * Add a POST request to your support endpoint here.
       * Example:
       * await fetch(`${API_URL}/support/contact`, {
       *   method: 'POST',
       *   body: JSON.stringify({ name, email, subject, message })
       * });
       */

      Alert.alert(
        "Request Submitted",
        "Your support request has been submitted. Our team will get back to you soon.",
        [{ text: "Back to Help", onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Send a Message</Text>
          <Text style={styles.subtitle}>
            Fill out the form below and we'll respond as soon as possible.
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <InputField
            label="Name"
            placeholder="Your name"
            value={name}
            editable={false} onChangeText={() => {}} // Auto-filled from profile
          />

          <InputField
            label="Email Address"
            placeholder="yourname@example.com"
            value={email}
            editable={false} onChangeText={() => {}} // Auto-filled from profile
          />

          <InputField
            label="Subject"
            placeholder="What do you need help with?"
            value={subject}
            onChangeText={setSubject}
            error={errors.subject}
          />

          <View style={styles.messageContainer}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.textArea, errors.message ? styles.textAreaError : null]}
              placeholder="Tell us how we can help..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            {errors.message ? <Text style={styles.errorText}>{errors.message}</Text> : null}
          </View>

          <View style={{ marginTop: 24 }}>
            <PrimaryButton 
              title={isSubmitting ? "Sending..." : "Submit Request"} 
              onPress={handleSubmit} 
              disabled={isSubmitting}
            />
          </View>

          <TouchableOpacity 
            style={styles.backLink} 
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Back to Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  titleSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  messageContainer: {
    marginTop: 4,
  },
  textArea: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 14,
    minHeight: 140,
    fontSize: 15,
    color: "#333",
  },
  textAreaError: {
    borderColor: "#FF5A5A",
  },
  errorText: {
    color: "#FF5A5A",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  backLink: {
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
});
