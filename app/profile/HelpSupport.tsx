import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import BackButton from "../../components/BackButton";

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
  {
    title: "How to report a stray animal",
    content: "Go to the Reporting tab, add photos, enter the animal's location and condition, and submit your report to notify nearby rescuers.",
  },
  {
    title: "How rescue status updates work",
    content: "When a rescuer accepts your report, its status changes to 'Accepted'. Once rescued and treated, the status will be marked as 'Completed'.",
  },
  {
    title: "How adoption requests work",
    content: "Browse animals available for adoption and contact the owner directly to express your interest.",
  },
  {
    title: "How donations are tracked",
    content: "You can track your donations in the Profile section. Donations go directly to verified NGOs and you will receive a receipt for your records.",
  },
  {
    title: "How NGO/Vet verification works",
    content: "NGOs and Vets must submit their registration details. Our admin team verifies these details to ensure authenticity before approving the account.",
  },
  {
    title: "How to set up PayHere donations",
    content: "1. In PayHere Sandbox, open Integrations. Copy your Merchant ID, add onrender.com as the website domain, then copy its Merchant Secret.\n\n2. For recurring donation management, open Settings > API Keys and create an API key. For sandbox testing, set Allowed Domains to *, then enable Subscription Management API and Automatic Charging API. Open View Credentials to copy the App ID and App Secret.\n\nMerchant Secret and App Secret are different. Keep both private.",
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(
    topic === "payhere" ? HELP_TOPICS.length - 1 : null
  );

  const toggleTopic = (index: number) => {
    setExpandedTopicIndex(expandedTopicIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
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
            <View key={index} style={[styles.topicContainer, index === HELP_TOPICS.length - 1 && { borderBottomWidth: 0 }]}>
              <TouchableOpacity
                style={styles.topicRow}
                onPress={() => toggleTopic(index)}
              >
                <Text style={styles.topicText}>{topic.title}</Text>
                <Ionicons name={expandedTopicIndex === index ? "chevron-down" : "chevron-forward"} size={16} color="#CCC" />
              </TouchableOpacity>
              {expandedTopicIndex === index && (
                <View style={styles.topicContentWrapper}>
                  <Text style={styles.topicContent}>{topic.content}</Text>
                </View>
              )}
            </View>
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
  topicContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  topicText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  topicContentWrapper: {
    paddingBottom: 14,
    paddingRight: 14,
  },
  topicContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
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
