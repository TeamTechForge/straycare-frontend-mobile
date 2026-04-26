import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function communityPostView() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/communityFeed/communityPostMain")}
        >
          <Ionicons name="arrow-back" size={24} color="#161c27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Feed</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Card */}
        <View style={styles.card}>
          {/* Hero Image */}
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGZgFp5IE78LHPUV5crp1xSrMloVw9KKXRgG2ksRvyzVngUAsByjGFC8aFawOTZjVH9DRXyo5TCIbGpcukzKTmgoF2jl4uoZXXAwPcgEazGkTK0MAXzM1uxTqW3vcZzW_UNwue3cEhxQM8lGJlZ_m4N58g5kBDrsIAh6-uZS6FT3rF3tbL8d_YknYhhjSa-Brvfee06EXClysWU12Ynt8jyFr0YLAAEHthv8nqmdFzwqADjoLxjEKCi1IOBiVBENqwmC7OLcy0Qu4E",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Meta Row */}
            <View style={styles.metaRow}>
              <Text style={styles.dateText}>OCT 24, 2023</Text>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>Pet Care Tips</Text>
              </View>
            </View>

            {/* Headline */}
            <Text style={styles.headline}>
              Injured Golden Retriever found near Central Park fountain
            </Text>

            {/* Author Row */}
            <View style={styles.authorRow}>
              <Text style={styles.authorText}>
                Posted by{" "}
                <Text style={styles.authorName}>Sarah Jenkins</Text>
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              I found this friendly Golden Retriever near the main fountain in
              Central Park around 2:00 PM today. The poor thing seems to have a
              minor limp in its front left paw but is otherwise very calm and
              well-behaved.
            </Text>
            <Text style={styles.description}>
              It was wearing a blue collar with no visible ID tag. I'm currently
              staying near the 72nd Street entrance. Please message me if you
              have any information or recognize this sweet dog!
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/communityFeed/communityPostMain")}
          >
            <Ionicons name="chevron-back" size={20} color="#704900" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => router.push("/communityFeed/reportCommunityPost")}
          >
            <MaterialIcons name="report" size={20} color="#E54D4D" />
            <Text style={styles.reportBtnText}>Report Post</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#161c27",
  },

  // Scroll
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  // Post Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  cardBody: {
    padding: 20,
    gap: 12,
  },

  // Meta Row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#837565",
    textTransform: "uppercase",
  },
  tagBadge: {
    backgroundColor: "#E6F7ED",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27C468",
  },

  // Headline
  headline: {
    fontSize: 22,
    fontWeight: "800",
    color: "#161c27",
    lineHeight: 28,
    letterSpacing: -0.4,
  },

  // Author
  authorRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F1F1",
  },
  authorText: {
    fontSize: 15,
    color: "#504537",
  },
  authorName: {
    fontWeight: "700",
    color: "#161c27",
  },

  // Description
  description: {
    fontSize: 15,
    color: "#504537",
    lineHeight: 24,
  },

  // Action Buttons
  actionsContainer: {
    gap: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9b959",
    borderRadius: 999,
    paddingVertical: 16,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#704900",
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF1F1",
    borderRadius: 999,
    paddingVertical: 16,
  },
  reportBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E54D4D",
  },
});