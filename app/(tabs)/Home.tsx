import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, FlatList } from "react-native";
import { API_URL } from "../../constants/config.constants";

const BRAND_COLOR = "#F5A623";

// Show the main landing screen with personalized data for the logged-in user.
export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debouncing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(debouncedQuery)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  //Loads user profile data 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (!token) return;

        // Validates the session with the backend and retrieves the latest user profile information.
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          // Updates the UI with user-specific details.
          setUser(data);
        }
      } catch (error) {
        console.error("Home fetch user error:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/straycarelogo.png")}
          style={styles.logo}
        />

        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => router.push("/Notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* GREETING */}
      <Text style={styles.greeting}>
        Hello, {user?.organizationName || user?.name || "User"} 👋{"\n"}
        <Text style={styles.greetingSub}>
          Together we can save more stray animals 🐾
        </Text>
      </Text>

      {/* ABOUT CARD */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About Us</Text>
        <View style={styles.aboutBox}>
          <Text style={styles.aboutText}>
            StrayCare is a mobile platform dedicated to rescuing, caring for,
            and finding homes for street animals in your area.
          </Text>
        </View>
      </View>

      {/* SEARCH BAR CONTAINER */}
      <View style={{ zIndex: 10, position: "relative" }}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#888" />
          <TextInput
            placeholder="Search for Vets/Shelters"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH RESULTS DROPDOWN OVERLAY */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchDropdown}>
            {searchLoading ? (
              <ActivityIndicator size="small" color={BRAND_COLOR} style={{ padding: 20 }} />
            ) : searchResults.length === 0 ? (
              <Text style={styles.noResultsText}>No verified NGOs, Shelters, or Veterinarians found.</Text>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => item.userId + index}
                style={{ maxHeight: 300 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchItem}
                    onPress={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      router.push(`/profile/${item.userId}`);
                    }}
                  >
                    <Image
                      source={
                        item.profileImage
                          ? { uri: item.profileImage }
                          : require("../../assets/images/straycarelogo.png")
                      }
                      style={styles.searchItemImage}
                    />

                    <View style={styles.searchItemDetails}>
                      <View style={styles.searchItemHeader}>
                        <Text style={styles.searchItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Ionicons name="checkmark-circle" size={14} color="#4A90E2" style={{ marginLeft: 4 }} />
                      </View>

                      {item.clinicName && (
                        <Text style={styles.searchItemClinic} numberOfLines={1}>
                          🏢 {item.clinicName}
                        </Text>
                      )}

                      <Text style={styles.searchItemLocation} numberOfLines={1}>
                        📍 {item.location}
                      </Text>

                      {item.bio ? (
                        <Text style={styles.searchItemBio} numberOfLines={1}>
                          {item.bio}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.type}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.grid}>
        <ActionCard
          icon={<MaterialCommunityIcons name="hand-heart" size={24} color="#F5A623" />}
          label="Donate"
          onPress={() => router.push("/donate")}
        />

        <ActionCard
          icon={<MaterialCommunityIcons name="dog" size={24} color="#F5A623" />}
          label="Report a Case"
          onPress={() => router.push("/reporting")}
        />

        <ActionCard
          icon={<MaterialCommunityIcons name="paw" size={24} color="#F5A623" />}
          label="Adopt a Pet"
        />

        <ActionCard
          icon={<Feather name="search" size={24} color="#F5A623" />}
          label="Lost & Found"
          onPress={() => router.push("/lost-and-found")}
        />
      </View>
    </View>
  );
}

// Reusable card component to keep quick action buttons .
function ActionCard({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.cardText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  notificationIcon: {
    position: "absolute",
    right: 0,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  greetingSub: {
    fontWeight: "400",
  },
  aboutCard: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  aboutBox: {
    backgroundColor: "#EED7B5",
    padding: 15,
    borderRadius: 10,
  },
  aboutText: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E5E5",
    paddingHorizontal: 12,
    borderRadius: 25,
    height: 45,
    marginBottom: 20,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
  },
  searchDropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 10,
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchItemImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  searchItemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  searchItemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    maxWidth: "85%",
  },
  searchItemClinic: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 2,
  },
  searchItemLocation: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  searchItemBio: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F5A623",
  },
  noResultsText: {
    padding: 20,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#FFF4E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    fontWeight: "500",
  },
});