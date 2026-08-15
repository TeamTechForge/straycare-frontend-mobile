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
import { getPostById, Post } from "../../services/adoptionService";

// ─── Paging Dots ──────────────────────────────────────────────────────────────

function PagingDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

// ─── Info Chip ────────────────────────────────────────────────────────────────

function InfoChip({
  icon,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.chip}>
      <MaterialIcons name={icon} size={20} color="#F5A623" />
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
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error || !post) {
    return (
      <View style={styles.centeredState}>
        <MaterialIcons name="error-outline" size={48} color="#717878" />
        <Text style={styles.errorText}>{error ?? "Something went wrong."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Build info chips ──────────────────────────────────────────────────────

  const chips: { icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
    { icon: post.gender === "Male" ? "male" : "female", label: post.gender },
    ...(post.age ? [{ icon: "cake" as keyof typeof MaterialIcons.glyphMap, label: post.age }] : []),
    { icon: "pets", label: post.category },
  ];

  const traits = (post.traits || []).map((label) => ({
    label,
    verified: true,
  }));

  const handleCall = () => {
    const phone = post.userId?.phone || post.contact;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleOpenChat = () => {
    router.push({
      pathname: "/chat/New",
      params: {
        targetUserId: post.userId?._id,
        userName: post.posterName || post.userId?.name,
        petName: post.name,
      },
    });
  };

  const images =
    post.images && post.images.length > 0
      ? post.images
      : ["https://placedog.net/600/400"];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image & Back Button ── */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: images[activeImage] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroScrim} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <MaterialIcons name="arrow-back" size={22} color="#191C1D" />
          </TouchableOpacity>

          {images.length > 1 && (
            <PagingDots total={images.length} active={activeImage} />
          )}
        </View>

        {/* ── Thumbnail Strip ── */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {images.map((uri, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setActiveImage(index)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri }}
                  style={[
                    styles.thumb,
                    index === activeImage && styles.thumbActive,
                  ]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Identity Card ── */}
        <View style={styles.identityCardWrapper}>
          <View style={styles.identityCard}>
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{post.name}</Text>
                <Text style={styles.petBreed}>
                  {post.breed}
                  {post.customCategory ? ` (${post.customCategory})` : ""}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <MaterialIcons name="check-circle" size={14} color="#D48806" />
                <Text style={styles.statusText}>{post.status}</Text>
              </View>
            </View>

            {/* Quick Info Chips */}
            <View style={styles.chipsRow}>
              {chips.map((c, i) => (
                <InfoChip key={i} icon={c.icon} label={c.label} />
              ))}
            </View>
          </View>
        </View>

        {/* ── About Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {post.name}</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.description}>{post.description}</Text>

            {/* Traits */}
            {traits.length > 0 && (
              <View style={styles.traitsBlock}>
                <Text style={styles.traitsHeading}>Characteristics</Text>
                <View style={styles.traitsWrap}>
                  {traits.map((t, i) => (
                    <View key={i} style={styles.traitChip}>
                      <MaterialIcons name="check" size={14} color="#D48806" />
                      <Text style={styles.traitText}>{t.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Health Status */}
            <View style={styles.healthStatusRow}>
              <Text style={styles.traitsHeading}>Health Status</Text>
              <View style={styles.healthBadge}>
                <Text style={styles.healthBadgeText}>{post.healthStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Poster Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caretaker Info</Text>
          <View style={styles.posterCard}>
            <View style={styles.posterRow}>
              <View style={[styles.posterAvatar, styles.posterAvatarPlaceholder]}>
                {post.userId?.avatar ? (
                  <Image
                    source={{ uri: post.userId.avatar }}
                    style={styles.posterAvatar}
                  />
                ) : (
                  <MaterialIcons name="person" size={28} color="#717878" />
                )}
              </View>
              <View style={styles.posterInfo}>
                <Text style={styles.posterName}>
                  {post.posterName || post.userId?.name || "StrayCare User"}
                </Text>
                {post.userId?.organisation && (
                  <Text style={styles.posterOrg}>{post.userId.organisation}</Text>
                )}
              </View>
              {(post.userId?.phone || post.contact) && (
                <TouchableOpacity
                  style={styles.phoneBtn}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="phone" size={20} color="#F5A623" />
                </TouchableOpacity>
              )}
            </View>

            {/* Location */}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#717878" />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes if any ── */}
        {post.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.description}>{post.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Bottom Action Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.meetBtn}
          onPress={handleOpenChat}
          activeOpacity={0.85}
        >
          <MaterialIcons name="chat" size={20} color="#000" />
          <Text style={styles.meetBtnText}>Adopt or Inquire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    gap: 12,
    padding: 24,
  },
  loadingText: { fontSize: 14, color: "#717878" },
  errorText: { fontSize: 15, color: "#717878", textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#F5A623",
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  heroWrapper: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#F3F4F5",
    position: "relative",
  },
  heroImage: { width: "100%", height: "100%" },
  heroScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: { borderRadius: 4 },
  dotActive: { width: 24, height: 6, backgroundColor: "#F5A623" },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.7)",
  },

  thumbStrip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#F3F4F5",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: "#F5A623" },

  identityCardWrapper: { paddingHorizontal: 16, marginTop: -36, zIndex: 10 },
  identityCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  identityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  petName: { fontSize: 22, fontWeight: "700", color: "#191C1D" },
  petBreed: { fontSize: 14, color: "#717878", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#D48806" },

  chipsRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E0D6",
    gap: 6,
  },
  chipLabel: { fontSize: 12, fontWeight: "600", color: "#191C1D" },

  section: { paddingHorizontal: 16, marginTop: 18, gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191C1D",
    paddingLeft: 2,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  description: { fontSize: 14, color: "#717878", lineHeight: 22 },

  traitsBlock: { gap: 8 },
  traitsHeading: { fontSize: 13, fontWeight: "600", color: "#191C1D" },
  traitsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  traitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF7E6",
  },
  traitText: { fontSize: 12, fontWeight: "600", color: "#D48806" },

  healthStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthBadge: {
    backgroundColor: "#F3F4F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthBadgeText: { fontSize: 12, fontWeight: "600", color: "#191C1D" },

  posterCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  posterRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  posterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F5",
  },
  posterAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  posterInfo: { flex: 1 },
  posterName: { fontSize: 15, fontWeight: "700", color: "#191C1D" },
  posterOrg: { fontSize: 13, color: "#717878", marginTop: 2 },
  phoneBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7E6",
    alignItems: "center",
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationText: {
    fontSize: 13,
    color: "#717878",
    fontWeight: "500",
    flex: 1,
  },

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E0D6",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E0D6",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#191C1D" },
  meetBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5A623",
  },
  meetBtnText: { fontSize: 15, fontWeight: "700", color: "#000" },
});