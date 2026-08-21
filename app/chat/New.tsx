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
} from "react-native";
import UserListItem from "../../components/chat/UserListItem";
import { useAuth } from "../../contexts/AuthContext";
import { useChatApi } from "../../hooks/useChatApi";

const BRAND_COLOR = "#F5A623";

/**
 * NewChatScreen
 * Search users and instantiate/open conversations.
 */
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

  const renderItem = ({ item }: any) => {
    return (
      <UserListItem 
        item={item} 
        onPress={handleSelectUser} 
        disabled={creating} 
      />
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
          placeholder="Search by name..."
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
          <Text style={styles.emptyText}>Type a name to search registered users.</Text>
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
