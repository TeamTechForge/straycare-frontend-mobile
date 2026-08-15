import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getPostById, Post } from "@/services/adoptionService";

// ─── Paging Dots ──────────────────────────────────────────────────────────────

function PagingDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );
}

// ─── Info Chip ────────────────────────────────────────────────────────────────

function InfoChip({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <MaterialIcons name={icon} size={20} color="#785a00" />
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ViewAdoptionPost() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  // ── Fetch post from backend ───────────────────────────────────────────────

  useEffect(() => {
    if (!postId) {
      setError("Post not found.");
      setLoading(false);
      return;
    }

    getPostById(postId)
      .then((data) => {
        setPost(data);
      })
      .catch(() => {
        setError("Could not load post. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#785a00" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error || !post) {
    return (
      <View style={styles.centeredState}>
        <MaterialIcons name="error-outline" size={48} color="#d2c5af" />
        <Text style={styles.errorText}>{error ?? "Something went wrong."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Build info chips (age is optional) ───────────────────────────────────

  const chips: { icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
    { icon: post.gender === "Male" ? "male" : "female", label: post.gender },
    ...(post.age ? [{ icon: "cake" as keyof typeof MaterialIcons.glyphMap, label: post.age }] : []),
    { icon: "pets", label: post.category },
  ];

  // ── Build traits array from post.traits string[] ──────────────────────────
  // Verified traits are ones the poster marked (Vaccinated, Microchipped etc.)
  const VERIFIED_TRAITS = ["Vaccinated", "Microchipped"];
  const traits = post.traits.map((label) => ({
    label,
    verified: VERIFIED_TRAITS.includes(label),
  }));

  // ── Handle phone call ─────────────────────────────────────────────────────

  const handleCall = () => {
    const phone = post.userId?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  // ── Navigate to report screen ─────────────────────────────────────────────

  const handleReport = () => {
    router.push(`/adoption-corner/ReportAdoptionPost?postId=${postId}`);
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroWrapper}>
          <Image
            source={{
              uri: post.images?.[activeImage] ?? "https://placedog.net/600/450",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroScrim} />

          {/* Back button overlaid */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <MaterialIcons name="arrow-back" size={22} color="#785a00" />
          </TouchableOpacity>

          {/* Paging dots — one per image */}
          {post.images?.length > 1 && (
            <PagingDots total={post.images.length} active={activeImage} />
          )}
        </View>

        {/* ── Thumbnail strip (if multiple images) ── */}
        {post.images?.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {post.images.map((uri, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveImage(i)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri }}
                  style={[styles.thumb, i === activeImage && styles.thumbActive]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Identity Card (overlaps hero) ── */}
        <View style={styles.identityCardWrapper}>
          <View style={styles.identityCard}>
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{post.name}</Text>
                <Text style={styles.petBreed}>{post.breed}</Text>
              </View>
              <View style={styles.statusBadge}>
                <MaterialIcons name="bolt" size={13} color="#6f5300" />
                <Text style={styles.statusText}>{post.status}</Text>
              </View>
            </View>

            {/* Chips: gender · age (optional) · category */}
            <View style={styles.chipsRow}>
              {chips.map((c) => (
                <InfoChip key={c.label} icon={c.icon} label={c.label} />
              ))}
            </View>
          </View>
        </View>

        {/* ── Animal Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animal Details</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.description}>{post.description}</Text>

            {/* Health & Traits */}
            {traits.length > 0 && (
              <View style={styles.traitsBlock}>
                <Text style={styles.traitsHeading}>Health &amp; Traits</Text>
                <View style={styles.traitsWrap}>
                  {traits.map((t) => (
                    <View
                      key={t.label}
                      style={[
                        styles.traitChip,
                        t.verified ? styles.traitChipVerified : styles.traitChipPlain,
                      ]}
                    >
                      {t.verified && (
                        <MaterialIcons name="verified" size={14} color="#785a00" />
                      )}
                      <Text
                        style={[
                          styles.traitText,
                          t.verified ? styles.traitTextVerified : styles.traitTextPlain,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Health Status badge */}
            <View style={styles.healthStatusRow}>
              <Text style={styles.traitsHeading}>Health Status</Text>
              <View style={styles.healthBadge}>
                <Text style={styles.healthBadgeText}>{post.healthStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Poster Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Poster Details</Text>
          <View style={styles.posterCard}>
            {/* Profile row: avatar · name/org · phone icon */}
            <View style={styles.posterRow}>
              {post.userId?.avatar ? (
                <Image
                  source={{ uri: post.userId.avatar }}
                  style={styles.posterAvatar}
                />
              ) : (
                <View style={[styles.posterAvatar, styles.posterAvatarPlaceholder]}>
                  <MaterialIcons name="person" size={24} color="#807663" />
                </View>
              )}
              <View style={styles.posterInfo}>
                <Text style={styles.posterName}>{post.userId?.name ?? post.posterName}</Text>
                {post.userId?.organisation ? (
                  <Text style={styles.posterOrg}>{post.userId.organisation}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.phoneBtn}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <MaterialIcons name="phone" size={22} color="#785a00" />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#785a00" />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Footer: Cancel + Report Post ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.meetBtn}
          onPress={handleReport}
          activeOpacity={0.85}
        >
          <Text style={styles.reportbtn}>Report Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f1fbff" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Centered states
  centeredState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "#f1fbff", gap: 12, padding: 24,
  },
  loadingText: { fontSize: 14, color: "#807663" },
  errorText: { fontSize: 15, color: "#807663", textAlign: "center" },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, backgroundColor: "#785a00",
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Hero
  heroWrapper: {
    width: "100%", aspectRatio: 4 / 3,
    backgroundColor: "#e4f0f4", position: "relative",
  },
  heroImage: { width: "100%", height: "100%" },
  heroScrim: {
    position: "absolute", top: 0, left: 0, right: 0, height: 100,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  backBtn: {
    position: "absolute", top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  dotsRow: {
    position: "absolute", bottom: 12, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6,
  },
  dot: { borderRadius: 4 },
  dotActive: { width: 24, height: 6, backgroundColor: "#f9c74f" },
  dotInactive: { width: 6, height: 6, backgroundColor: "rgba(255,255,255,0.7)" },

  // Thumbnail strip
  thumbStrip: {
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  thumb: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: "#e4f0f4", marginRight: 8,
    borderWidth: 2, borderColor: "transparent",
  },
  thumbActive: { borderColor: "#785a00" },

  // Identity card
  identityCardWrapper: { paddingHorizontal: 16, marginTop: -36, zIndex: 10 },
  identityCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 20, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  identityTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  petName: { fontSize: 22, fontWeight: "700", color: "#131d21" },
  petBreed: { fontSize: 14, color: "#4e4635", marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f9c74f", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#6f5300" },

  // Chips
  chipsRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 12, backgroundColor: "#eaf5fa", borderRadius: 16, gap: 6,
  },
  chipLabel: { fontSize: 12, fontWeight: "600", color: "#131d21" },

  // Section
  section: { paddingHorizontal: 16, marginTop: 20, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#131d21", paddingLeft: 2 },
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 22, padding: 18, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  description: { fontSize: 15, color: "#4e4635", lineHeight: 24 },

  // Traits
  traitsBlock: { gap: 10 },
  traitsHeading: { fontSize: 14, fontWeight: "600", color: "#131d21" },
  traitsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  traitChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  traitChipVerified: { backgroundColor: "rgba(120,90,0,0.10)" },
  traitChipPlain: { backgroundColor: "#e4f0f4" },
  traitText: { fontSize: 12, fontWeight: "500" },
  traitTextVerified: { color: "#785a00" },
  traitTextPlain: { color: "#4e4635" },

  // Health status
  healthStatusRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  healthBadge: {
    backgroundColor: "#eaf5fa", paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  healthBadgeText: { fontSize: 12, fontWeight: "600", color: "#785a00" },

  // Poster
  posterCard: {
    backgroundColor: "#fff", borderRadius: 22, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  posterRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  posterAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#e4f0f4" },
  posterAvatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  posterInfo: { flex: 1 },
  posterName: { fontSize: 15, fontWeight: "700", color: "#131d21" },
  posterOrg: { fontSize: 13, color: "#4e4635", marginTop: 2 },
  phoneBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#eaf5fa", alignItems: "center", justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  locationText: { fontSize: 13, color: "#4e4635", fontWeight: "500", flex: 1 },

  // Footer
  footer: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#f1fbff",
    borderTopWidth: 1, borderTopColor: "#e4f0f4",
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 28,
    borderWidth: 1.5, borderColor: "#807663",
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#131d21" },
  meetBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 28, backgroundColor: "#785a00",
    shadowColor: "#785a00", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  reportbtn: { fontSize: 15, fontWeight: "700", color: "#fff" },
});