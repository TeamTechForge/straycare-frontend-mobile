// app/chat/new.tsx
// Start New Chat Screen — search users and instantiate/open conversations.

import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useChatApi } from "../../hooks/useChatApi";

const BRAND_COLOR = "#F5A623";

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { searchUsers, createConversation } = useChatApi();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Debounced search logic
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = (await searchUsers(search)) as any[];
        setResults(users);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 350); // 350ms debounce

    return () => clearTimeout(timer);
  }, [search, searchUsers]);

  // Handle user selection
  const handleSelectUser = async (selectedUser: any) => {
    if (creating) return;

    if (selectedUser.permissions && selectedUser.permissions.canMessage === false) {
      router.push(`/profile/${selectedUser._id}`);
      return;
    }

    setCreating(true);

    try {
      // Find or create conversation
      const conversation = (await createConversation(selectedUser._id, "direct")) as any;

      // Locate recipient details
      const otherParticipant = conversation.participants?.find(
        (p: any) => p._id !== user?._id
      );

      // Navigate to chat room
      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conversation._id,
          recipientName: otherParticipant?.name || selectedUser.name,
          recipientId: selectedUser._id,
          recipientImage: otherParticipant?.profileImage || selectedUser.profileImage || "",
        },
      });
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      Alert.alert(
        "Could Not Start Chat",
        error.message || "Something went wrong while creating the conversation."
      );
    } finally {
      setCreating(false);
    }
  };

  // Helper to format role name for badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ngo":
        return { text: "NGO/SHELTER", color: "#3B82F6", bg: "#EFF6FF" };
      case "vet":
        return { text: "VET", color: "#10B981", bg: "#ECFDF5" };
      case "volunteer":
        return { text: "VOLUNTEER", color: "#F59E0B", bg: "#FEF3C7" };
      default:
        return { text: "USER", color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const renderItem = ({ item }: any) => {
    const badge = getRoleBadge(item.role);
    // Get user initials for avatar
    const initials = item.name
      ? item.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
      : "?";

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleSelectUser(item)}
        disabled={creating}
      >
        {/* Avatar Circle */}
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>
                {badge.text}
              </Text>
            </View>
          </View>
          <Text style={styles.emailText} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Action Icon */}
        {item.permissions?.canMessage === false ? (
          <Feather name="lock" size={18} color="#9CA3AF" />
        ) : (
          <Feather name="message-square" size={18} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>New Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#555" />
        <TextInput
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#777"
          autoFocus
          editable={!creating}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")} disabled={creating}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* CREATING CONVERSATION OVERLAY */}
      {creating && (
        <View style={styles.creatingOverlay}>
          <ActivityIndicator size="small" color={BRAND_COLOR} />
          <Text style={styles.creatingText}>Starting conversation...</Text>
        </View>
      )}

      {/* SEARCH RESULTS */}
      {loading ? (
        <ActivityIndicator size="large" color={BRAND_COLOR} style={{ marginTop: 40 }} />
      ) : results.length === 0 && search.trim().length > 0 ? (
        /* NO RESULTS */
        <View style={styles.emptyContainer}>
          <Feather name="users" size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No matching users found.</Text>
        </View>
      ) : search.trim().length === 0 ? (
        /* INITIAL STATE */
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={36} color="#9CA3AF" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Type a name or email to search registered users.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  searchBox: {
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111",
  },
  creatingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  creatingText: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    maxWidth: "70%",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  emailText: {
    fontSize: 13,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
