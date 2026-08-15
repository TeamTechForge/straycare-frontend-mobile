// components/CommunityPostCard.tsx

import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import ReportModal from "./ReportPostModal";
import type { CommunityPost } from "../services/communityService";

// ─────────────────────────────────────────────
// COLORS  (matches CommunityPostMain palette)
// ─────────────────────────────────────────────

const C = {
  surface: "#F9F9FF",
  surfaceContainerLowest: "#FFFFFF",
  onSurface: "#121C2C",
  onSurfaceVariant: "#4D4637",
  outline: "#7F7665",
  outlineVariant: "#D1C5B2",
  primary: "#F28C28",
  primaryContainer: "#FFF0DD",
  onPrimaryContainer: "#8A4A00",
};

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface CommunityPostCardProps {
  post: CommunityPost;
  onReport: (
    postId: string,
    reason: string
  ) => void | Promise<void>;
}

// ─────────────────────────────────────────────
// DATE FORMATTER
// ─────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const CommunityPostCard: React.FC<
  CommunityPostCardProps
> = ({ post, onReport }) => {
  const router = useRouter();

  // Report modal visibility
  const [reportVisible, setReportVisible] =
    useState(false);

  // Show / hide overflow menu
  const [menuVisible, setMenuVisible] =
    useState(false);

  // ── Navigate to full post ─────────────────
  const handlePress = () => {
    router.push({
      pathname:
        "/community-feed/CommunityPostView",
      params: { id: post._id },
    });
  };

  // ── Report submission ─────────────────────
  const handleReportSubmit = async (
    reason: string
  ) => {
    await onReport(post._id, reason);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        {/* ── Image ── */}
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Category badge + overflow */}
          <View style={styles.topRow}>
            {post.category ? (
              <View
                style={styles.categoryBadge}
              >
                <Text
                  style={
                    styles.categoryBadgeText
                  }
                >
                  {post.category}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {/* ⋮ Overflow */}
            <TouchableOpacity
              hitSlop={{
                top: 10,
                bottom: 10,
                left: 10,
                right: 10,
              }}
              onPress={() =>
                setMenuVisible(
                  (prev) => !prev
                )
              }
            >
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={C.outline}
              />
            </TouchableOpacity>
          </View>

          {/* Overflow dropdown */}
          {menuVisible && (
            <View style={styles.overflowMenu}>
              <TouchableOpacity
                style={
                  styles.overflowMenuItem
                }
                onPress={() => {
                  setMenuVisible(false);
                  setReportVisible(true);
                }}
              >
                <Ionicons
                  name="flag-outline"
                  size={16}
                  color="#E53935"
                />
                <Text
                  style={
                    styles.overflowMenuText
                  }
                >
                  Report
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Title */}
          <Text
            style={styles.title}
            numberOfLines={2}
          >
            {post.title || "Untitled"}
          </Text>

          {/* Content preview */}
          <Text
            style={styles.content}
            numberOfLines={3}
          >
            {post.content || ""}
          </Text>

          {/* Footer: author + date */}
          <View style={styles.footer}>
            <View
              style={styles.authorRow}
            >
              <Ionicons
                name="person-circle-outline"
                size={16}
                color={C.outline}
              />
              <Text
                style={styles.authorText}
              >
                {post.authorName || "Anonymous"}
              </Text>
            </View>

            <Text style={styles.dateText}>
              {formatDate(
                post.submittedAt ||
                  post.createdAt
              )}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Report Modal ── */}
      <ReportModal
        visible={reportVisible}
        onClose={() =>
          setReportVisible(false)
        }
        onSubmit={handleReportSubmit}
      />
    </>
  );
};

export default CommunityPostCard;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor:
      C.surfaceContainerLowest,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: "#D1C5B220",

    overflow: "hidden",

    // Android shadow
    elevation: 2,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  image: {
    width: "100%",
    height: 180,
  },

  body: {
    padding: 16,
    gap: 8,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryBadge: {
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },

  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.onPrimaryContainer,
    letterSpacing: 0.3,
  },

  // Overflow menu
  overflowMenu: {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 10,

    backgroundColor: "#FFFFFF",
    borderRadius: 12,

    paddingVertical: 6,
    paddingHorizontal: 4,

    elevation: 6,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    minWidth: 130,
  },

  overflowMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,

    paddingVertical: 10,
    paddingHorizontal: 14,

    borderRadius: 8,
  },

  overflowMenuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E53935",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    lineHeight: 22,
  },

  content: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    lineHeight: 19,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginTop: 4,
    paddingTop: 10,

    borderTopWidth: 1,
    borderTopColor: "#D1C5B215",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  authorText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.outline,
  },

  dateText: {
    fontSize: 11,
    fontWeight: "500",
    color: C.outlineVariant,
    letterSpacing: 0.3,
  },
});
