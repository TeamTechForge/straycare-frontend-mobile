import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Category options matching the HTML chips
const CATEGORIES = [
  "Pet Care Tips",
  "Health & First Aid",
  "Stray Animal Help",
  "Training & Behavior",
  "Animal Welfare & Rights Awareness",
  "Success Stories",
  "Events & Campaigns",
];

export default function CreateCommunityPost() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [sightingDate, setSightingDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Pet Care Tips");

  // Handle form submission
  const handleSubmit = () => {
    console.log({
      title,
      content,
      authorName,
      sightingDate,
      selectedCategory,
    });
    // TODO: connect to API
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Community Post</Text>
        {/* Spacer to centre the title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Scrollable Form Body ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Post Title ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Post Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter the title of the post"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* ── Category Chips ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Category</Text>
          <View style={styles.chipsContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  selectedCategory === cat && styles.chipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedCategory === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Post Content ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Post Content</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter the content of the post"
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* ── Upload Photo (Optional) ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Upload Photo (Optional)</Text>
          <TouchableOpacity style={styles.uploadBox}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="camera-outline" size={24} color="#eab308" />
            </View>
            <Text style={styles.uploadPrimary}>Tap to upload animal photo</Text>
            <Text style={styles.uploadSecondary}>PNG, JPG up to 10MB</Text>
          </TouchableOpacity>
        </View>

        {/* ── Author Name ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Author Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            value={authorName}
            onChangeText={setAuthorName}
          />
        </View>

        {/* ── Date of Sighting ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Date of Sighting</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={sightingDate}
            onChangeText={setSightingDate}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* ── Vertical Spacer ── */}
        <View style={styles.spacer} />

        {/* ── Action Buttons ── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Root container
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  // Balances the back button so the title stays centred
  headerSpacer: {
    width: 40,
  },

  // ── Scroll View ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ── Generic Form Section Wrapper ──
  section: {
    marginBottom: 28,
  },

  // Section label
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },

  // ── Text Input ──
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#1f2937",
  },

  // Multiline textarea variant
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },

  // ── Category Chips ──
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  // Active / selected chip (yellow fill)
  chipActive: {
    backgroundColor: "#f5c542",
    borderColor: "#f5c542",
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
  },
  chipTextActive: {
    color: "#000000",
    fontWeight: "600",
  },

  // ── Upload Photo Box ──
  uploadBox: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  // Yellow circle icon container
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef9c3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadPrimary: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  uploadSecondary: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  // ── Vertical Spacer ──
  spacer: {
    height: 48,
  },

  // ── Action Buttons ──
  actionsSection: {
    gap: 12,
  },
  // Primary yellow submit button
  submitButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "#f5c542",
    borderRadius: 9999,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  // Secondary light cancel button
  cancelButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "#f0f4f8",
    borderRadius: 9999,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
  },
});