import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const C = {
  surface: "#f9f9ff",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#121c2c",
  onSurfaceVariant: "#4d4637",
  outline: "#7f7665",
  outlineVariant: "#d1c5b2",
  primary: "#775a00",
  primaryContainer: "#fcd371",
  onPrimaryContainer: "#765a00",
};

const POSTS = [
  {
    id: "1",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCfMW8CY30Ifaj_ECNGPxR1w3mPbot98lpy1C4KUBnnfGasw_Rn_KFckRbedOrBKTwj78nLQorp1AHiI-RLjswr9Y3sE79_Ua_0CSDIjRFBYZXTz4zztYJICuxdwV7kMjYVoF2XWfooHqGHoU15kUiRkRP0GhaTFwG6Y6lvUxX43YxAaFYWJO5yYvavQZgWMSD2IKUrL9I2H7imlK3zLKMQAGwrNf6X469A4DQ2rTsvLRnLOtmEqNwveeqR1yLvWumzH8gOJRWisFs",
    name: "Dr. Sarah Wilson",
    timeAgo: "15m ago",
    role: "Pet Care Expert",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeap92wCD_wmPHW6areBpwAYRR3L9yv06Q_J-Mdx013gmQXgEFTTS0G98s_8IKKCx3suBxe-CeyOH00vSwfTPfhIMYrc22E8Y03KIiqsIdQcMH8c4ctQ1uGP204i6DWutFsbWkIoFHJI2vFqaV56AX5RIF2j2oX29dxMUkdqh0iv2wdlbAqGenJjT5GpGABihyTS6gv9k9F5zjORzRBsphrsVXJ1jMGa7kzcWTJeqje361NRTdKbw7gRcAU62myCCMG2T-g_ZbOsA",
    title: "Summer Hydration Tips",
    body: "Keep your furry friends cool this summer with these simple hydration hacks. Make sure fresh water is always available in multiple spots around your home and garden. Consider getting a pet water fountain, as moving water encourages animals to drink more throughout the day.",
    likes: "1.2k",
    comments: "48",
    liked: true,
  },
  {
    id: "2",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCajcDpd_TJQsF2pdGSMOOc3iyppTIrd4tX31W1Z6PmgxG0nI4mGzsuQMoSpt3b7TM8ibnEPKoclO1n4SqbdpC26PEB9zj4_ULDv0Zmgm4qBXRuo8RcIYpWPY1yzFiFx76629DnPMKwv9XK1glUvUIqf3qWW0gqmOl6EuF7nIP-Uhf6LVXjqro5YOj9B2LaHyP2ka4qVgYXieDatFkIThs9O0uNnxcyFFKdSTD_u10n_Hqcm6ZKzxZjkiKYwOAZn-Q8Q1RQ-pnbq9Q",
    name: "Maya Brooks",
    timeAgo: "2h ago",
    role: "Community Member",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAI8BsI151_aTRA_9I0_Me_5V6sR7tzoiwgNihhaVn5lu8xtC3tmAZUlyzAYm0gyrBEA7YBDwJ5IUV5mB1VI_zIKeOa8hSQvAt-s5fDs3UI-eIwLCCetbtHkoMW3BS90AP6YdXovmz7dHy-2qwI6hpECpW5q5AN2vW2zq3Vu3X4mypmpwYAwCLeXHIEJ1MQNAQVl8aRIwq4hLBnSWZD963lrq6y30kzIKyRoq64lcHlCbXrNRnX88EUKNPL40H0CEesSJeWeEr_NrY",
    title: "New Bed Success!",
    body: "Finally found a bed that Luna actually uses — it's the little wins in life! I tried four different beds over the past year and she ignored every single one. This one has a raised rim she can rest her chin on, and apparently that was the secret all along.",
    likes: "856",
    comments: "12",
    liked: false,
  },
];

const CATEGORIES = ["Pet Care Tips", "Health & First Aid", "Stray Animal Help"];

// ── Post Card Component ────────────────────────────────────────────────────────
function PostCard({ post }: { post: (typeof POSTS)[0] }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() =>
        router.push({
          pathname: "/communityFeed/postView",
          params: { id: post.id },
        })
      }
    >
      <View style={styles.card}>
        {/* Author row */}
        <View style={styles.cardHeader}>
          <View style={styles.authorRow}>
            <Image source={{ uri: post.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.authorName}>{post.name}</Text>
              <Text style={styles.authorMeta}>
                {post.timeAgo} • {post.role}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="more-horiz" size={20} color={C.outline} />
          </TouchableOpacity>
        </View>

        {/* Post image */}
        <Image source={{ uri: post.image }} style={styles.postImage} />

        {/* Title + body */}
        <View style={styles.cardBody}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postBody} numberOfLines={4}>
            {post.body}
          </Text>
        </View>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => {
                e.stopPropagation(); // prevent card navigation on like tap
                setLiked(!liked);
              }}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? C.primary : C.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.actionCount,
                  { color: liked ? C.primary : C.onSurfaceVariant },
                ]}
              >
                {post.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <MaterialCommunityIcons
                name="comment-outline"
                size={22}
                color={C.onSurfaceVariant}
              />
              <Text style={[styles.actionCount, { color: C.onSurfaceVariant }]}>
                {post.comments}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // prevent card navigation on save tap
              setSaved(!saved);
            }}
          >
            <MaterialCommunityIcons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={C.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function CommunityFeed() {
  const router = useRouter();
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Pet Care Tips");
  const [searchText, setSearchText] = useState("");

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Feed</Text>
        <TouchableOpacity onPress={() => router.push("/communityFeed/createPost")}>
          <Ionicons name="add" size={26} color={C.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category"
            placeholderTextColor={C.outline}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => setFilterVisible(!filterVisible)}>
            <MaterialIcons name="tune" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        {filterVisible && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    isActive
                      ? styles.categoryPillActive
                      : styles.categoryPillInactive,
                  ]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isActive
                          ? C.onPrimaryContainer
                          : C.onSurfaceVariant,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Foster Banner Card */}
        <View style={styles.bannerCard}>
          <MaterialCommunityIcons
            name="hand-heart"
            size={32}
            color={C.primary}
          />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Foster Parents Needed</Text>
            <Text style={styles.bannerBody}>
              Shelter at capacity. Could you foster?
            </Text>
          </View>
          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    paddingTop: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f9f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d1c5b220",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121c2c",
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d1c5b215",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1c5b240",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#121c2c",
    padding: 0,
  },

  // Category pills
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContent: {
    gap: 8,
    paddingBottom: 2,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryPillActive: {
    backgroundColor: "#fcd371",
  },
  categoryPillInactive: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1c5b240",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Feed
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 16,
  },

  // Post Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1c5b220",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#d1c5b220",
  },
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#121c2c",
    letterSpacing: 0.2,
  },
  authorMeta: {
    fontSize: 10,
    color: "#7f7665",
    marginTop: 1,
  },
  postImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#121c2c",
  },
  postBody: {
    fontSize: 13,
    color: "#4d4637",
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#d1c5b215",
  },
  actionsLeft: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Foster Banner Card
  bannerCard: {
    backgroundColor: "#fcd37118",
    borderWidth: 1,
    borderColor: "#fcd37145",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  bannerText: {
    alignItems: "center",
    gap: 4,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#775a00",
  },
  bannerBody: {
    fontSize: 13,
    color: "#4d4637",
    textAlign: "center",
  },
  bannerBtn: {
    backgroundColor: "#775a00",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  bannerBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});