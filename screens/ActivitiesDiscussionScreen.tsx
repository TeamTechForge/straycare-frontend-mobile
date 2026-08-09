import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { typography } from "../constants/typography.constants";
import { useRouter, type Href } from "expo-router";

/* ──────────────────────────────────────────────
 * Route constants – typed once, used everywhere
 * ────────────────────────────────────────────── */
const nearbyRescuersRoute = "/NearbyRescuers" as Href;
const rescueHistoryRoute = "/RescueHistory" as Href;
const myRescuesRoute = "/MyRescues" as Href;
const discussionForumRoute = "/DiscussionForum" as Href;

export default function ActivitiesDiscussionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Page Header matching Mockup ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backPill}
          activeOpacity={0.7}
          onPress={() => router.push("/request-status" as Href)}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>request-status/index</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities & Discussion</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════
         *  Hero Banner & Find Rescuers Button
         * ══════════════════════════════════════════ */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>
                Together,{"\n"}
                <Text style={styles.heroHighlight}>we save lives. 🧡</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Track rescues, explore stories, and connect with fellow animal lovers.
              </Text>
            </View>
            <Image
              source={require("../assets/images/hero_pets.jpg")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Find Nearby Rescuers Button */}
          <TouchableOpacity
            style={styles.findBtn}
            activeOpacity={0.85}
            onPress={() => router.push(nearbyRescuersRoute)}
          >
            <View style={styles.findIconCircle}>
              <Text style={styles.findIcon}>📍</Text>
            </View>
            <Text style={styles.findText}>Find Nearby Rescuers</Text>
            <Text style={styles.findArrow}>❯</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════
         *  Rescue Journey Card – Stat Cards Grid
         * ══════════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconCircle}>
              <Text style={styles.headerIcon}>🐾</Text>
            </View>
            <View style={styles.headerTextColumn}>
              <Text style={styles.cardTitle}>Rescue Journey</Text>
              <Text style={styles.cardSubtitle}>Your impact in numbers</Text>
            </View>
          </View>

          {/* Stat columns */}
          <View style={styles.statsRow}>
            {/* ── My Rescue stat card ── */}
            <View style={styles.statCard}>
              <Image
                source={require("../assets/images/my_rescue_illus.jpg")}
                style={styles.statImage}
                resizeMode="contain"
              />
              <Text style={styles.statLabel}>My Rescue</Text>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statUnit}>rescues</Text>

              <TouchableOpacity
                style={styles.cardBtn}
                activeOpacity={0.75}
                onPress={() => router.push(myRescuesRoute)}
              >
                <Text style={styles.cardBtnText}>View Details  ›</Text>
              </TouchableOpacity>
            </View>

            {/* ── Full Rescue History stat card ── */}
            <View style={styles.statCard}>
              <Image
                source={require("../assets/images/history_illus.jpg")}
                style={styles.statImage}
                resizeMode="contain"
              />
              <Text style={styles.statLabel}>Full Rescue History</Text>
              <Text style={styles.statValue}>110</Text>
              <Text style={styles.statUnit}>rescues</Text>

              <TouchableOpacity
                style={styles.cardBtn}
                activeOpacity={0.75}
                onPress={() => router.push(rescueHistoryRoute)}
              >
                <Text style={styles.cardBtnText}>View History  ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════
         *  Discussion Forum Card – Redesigned Card
         * ══════════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.forumTopRow}>
            <View style={styles.forumLeft}>
              <View style={styles.cardHeaderForum}>
                <View style={styles.headerIconCircle}>
                  <Text style={styles.headerIcon}>💬</Text>
                </View>
                <Text style={styles.cardTitle}>Discussion Forum</Text>
              </View>
              <Text style={styles.cardSubtitleForum}>
                Share ideas, ask questions, and support each other.
              </Text>
            </View>
            <Image
              source={require("../assets/images/forum_illus.jpg")}
              style={styles.forumImage}
              resizeMode="contain"
            />
          </View>

          {/* Join button */}
          <TouchableOpacity
            style={styles.joinBtn}
            activeOpacity={0.85}
            onPress={() => router.push(discussionForumRoute)}
          >
            <Text style={styles.joinText}>Join the Discussion</Text>
            <View style={styles.joinArrowCircle}>
              <Text style={styles.joinArrow}>❯</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════
         *  Footer Banner — Every small action...
         * ══════════════════════════════════════════ */}
        <View style={styles.footerBanner}>
          <View style={styles.footerLeft}>
            <View style={styles.footerIconCircle}>
              <Text style={styles.footerIcon}>🐾</Text>
            </View>
            <View style={styles.footerTextWrap}>
              <Text style={styles.footerTitle}>Every small action creates a big change.</Text>
              <Text style={styles.footerSubtitle}>Thank you for being a voice for the voiceless.</Text>
            </View>
          </View>
          <Image
            source={require("../assets/images/footer_hands.jpg")}
            style={styles.footerHandsImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════
 *  Styles – mockup alignment + theme tokens
 * ═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAF9F6", // very light warm background
  },
  page: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    position: "relative",
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
    zIndex: 10,
  },
  backChevron: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    marginTop: -2,
  },
  backText: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: "#111111",
  },
  headerTitle: {
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
    lineHeight: 56,
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.text,
    zIndex: 1,
  },

  // ── Hero Section ──
  heroSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end", // Align pets to bottom line
    gap: spacing.xs,
  },
  heroLeft: {
    flex: 1.1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: colors.text,
    lineHeight: 32,
  },
  heroHighlight: {
    color: colors.primary, // #FEB94B
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: typography.regular,
    color: "#6B7280",
    lineHeight: 18,
  },
  heroImage: {
    width: 130,
    height: 140,
    marginBottom: -8, // Bleed to bottom of hero card
  },

  // ── Find Nearby Button ──
  findBtn: {
    backgroundColor: colors.primary, // #FEB94B
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  findIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  findIcon: {
    fontSize: 16,
  },
  findText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: typography.bold,
    flex: 1,
    marginLeft: spacing.sm,
  },
  findArrow: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTextColumn: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: "#9CA3AF",
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB", // mockup clean white/light gray background
    borderRadius: 16,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 2,
  },
  statImage: {
    width: "100%",
    height: 90,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: "#1F2937", // mockup dark charcoal text
    textAlign: "center",
    height: 32, // fix height to align counts
  },
  statValue: {
    fontSize: 28,
    fontFamily: typography.bold,
    color: colors.primary,
    marginTop: 2,
  },
  statUnit: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: "#6B7280",
    marginBottom: spacing.xs,
  },
  cardBtn: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20, // pill shaped button
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  cardBtnText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: colors.primary,
  },

  // ── Discussion Forum Redesign ──
  forumTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  forumLeft: {
    flex: 1.2,
    gap: spacing.xs,
  },
  cardHeaderForum: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardSubtitleForum: {
    fontSize: 13,
    fontFamily: typography.regular,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  forumImage: {
    width: 100,
    height: 85,
    flex: 0.8,
    alignSelf: "center",
  },
  joinBtn: {
    backgroundColor: colors.primary, // #FEB94B
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  joinText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: typography.bold,
    flex: 1,
  },
  joinArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  joinArrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "bold",
  },

  // ── Footer Banner ──
  footerBanner: {
    backgroundColor: "#FFF8EA", // warm cream background matching mockup
    borderRadius: 20,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.15)",
    overflow: "hidden",
    position: "relative",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1.3,
    zIndex: 2,
  },
  footerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.2)",
  },
  footerIcon: {
    fontSize: 14,
  },
  footerTextWrap: {
    flex: 1,
    gap: 2,
  },
  footerTitle: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: colors.text,
  },
  footerSubtitle: {
    fontSize: 10,
    fontFamily: typography.regular,
    color: "#6B7280",
  },
  footerHandsImage: {
    width: 80,
    height: 70,
    position: "absolute",
    right: -10,
    bottom: -15,
    opacity: 0.15, // faded overlay effect
    zIndex: 1,
  },
});
