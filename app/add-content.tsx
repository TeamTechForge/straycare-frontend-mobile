import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import AppButton from "../components/ui/AppButton";

export default function AddContent() {
  const router = useRouter();
  const [content, setContent] = useState("");

  const onPublish = () => {
  if (!content.trim()) return;

  router.push({
    pathname: "/thread-published",
    params: { content },
  });
};




  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Add Content</Text>

          {/* Spacer to keep title centered */}
          <View style={{ width: 36 }} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.card}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your content here..."
              placeholderTextColor="#8A8A8A"
              style={styles.input}
              multiline
              textAlignVertical="top"
            />
          </View>

          <AppButton
            title="Publish  ⤴"
            onPress={onPublish}
            disabled={!content.trim()}
            style={styles.publishBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 28,
    color: colors.text,
    lineHeight: 28,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.semibold,
    fontSize: 18,
    color: colors.text,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },

  card: {
    width: "100%",
    height: 360,
    backgroundColor: "#F7F1E6", // light cream like your figma
    borderRadius: 16,
    padding: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: typography.regular, // Inter
    fontSize: 15,
    color: colors.text,
  },

  publishBtn: {
    marginTop: spacing.xl,
    minWidth: 200,
    borderRadius: 14,
    alignSelf: "center",
  },
});
