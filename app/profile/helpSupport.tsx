import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * HelpSupportScreen
 * Purpose: Main help and support page for StrayCare.
 * Includes Quick Help topics, FAQ section, and navigation to Contact Support.
 */

const BRAND_COLOR = "#F5A623";

const FAQ_DATA = [
  {
    question: "How do I report a stray animal?",
    answer: "Open the Report tab, add photos, location, and condition details, then submit the report.",
  },
  {
    question: "Who receives my report?",
    answer: "Nearby rescuers, NGOs, shelters, or volunteers may be notified depending on availability and location.",
  },
  {
    question: "Why is my NGO/Vet account pending?",
    answer: "NGO and Vet accounts require admin verification to keep the platform safe and trusted.",
  },
  {
    question: "Can I update my profile?",
    answer: "Yes, go to Profile > Edit Profile to update your information.",
  },
  {
    question: "How do notifications work?",
    answer: "Notifications inform you about rescue updates, verification status, profile updates, and important app messages.",
  },
];

const HELP_TOPICS = [
  "How to report a stray animal",
  "How rescue status updates work",
  "How adoption requests work",
  "How donations are tracked",
  "How NGO/Vet verification works",
];

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Intro */}
      <View style={styles.introSection}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>
          Find answers, learn how StrayCare works, or contact our team.
        </Text>
      </View>

      {/* Quick Help Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>QUICK HELP TOPICS</Text>
        <View style={styles.card}>
          {HELP_TOPICS.map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.topicRow, index === HELP_TOPICS.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={styles.topicText}>{topic}</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        {FAQ_DATA.map((item, index) => (
          <View key={index} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        ))}
      </View>

      {/* Contact Support Section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Need More Help?</Text>
        <Text style={styles.contactSubtitle}>
          If you couldn't find what you were looking for, our team is here to help.
        </Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push("/profile/ContactSupport")}
        >
          <Ionicons name="mail-outline" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
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
  introSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLOR,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  topicText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 10,
    backgroundColor: "#FFF9F0",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFEFD5",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  contactSubtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  contactButton: {
    flexDirection: "row",
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
