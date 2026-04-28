import { Feather, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BRAND_COLOR = "#F5A623";

export default function ChatsScreen() {
  const [search, setSearch] = useState("");

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="call-outline" size={24} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="trash-outline" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#555" />
        <TextInput
          placeholder="Search here"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#777"
        />
      </View>

      {/* EMPTY STATE */}
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="chatbubble-ellipses-outline" size={34} color={BRAND_COLOR} />
        </View>

        <Text style={styles.emptyTitle}>No chats yet</Text>

        <Text style={styles.emptyText}>
          Your rescue and support conversations will appear here once you start chatting.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    position: "relative",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  headerIcons: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    gap: 18,
  },
  searchBox: {
    height: 46,
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 90,
  },
  emptyIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});