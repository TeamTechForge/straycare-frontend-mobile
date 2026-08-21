import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CallLogService } from "../../services/callLogService";
import { useCall } from "../../contexts/CallContext";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";

const BRAND_COLOR = "#F5A623";

/**
 * CallHistoryScreen
 * Displays a list of past audio/video calls (incoming, outgoing, missed).
 * Allows users to call back, start a chat, or manage their call logs.
 */
export default function CallHistoryScreen() {
  const router = useRouter();
  const { startCall } = useCall();
  const { refreshCallBadge } = useSocket();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchHistory();
    markAsSeen();
  }, []);

  /** Marks all unseen call logs as seen, resetting any notification badges */
  const markAsSeen = async () => {
    try {
      await CallLogService.markSeen();
      refreshCallBadge();
    } catch (err) {
      console.error("Failed to mark calls as seen", err);
    }
  };

  /** Fetches the user's call history from the backend */
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await CallLogService.getHistory();
      setLogs(data as any[]);
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Clears all call history for the current user after confirmation */
  const handleClear = () => {
    Alert.alert("Clear Call History", "Are you sure you want to delete all call logs?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          try {
            await CallLogService.clearHistory();
            setLogs([]);
          } catch (error) {
            console.error("Failed to clear history:", error);
          }
        },
      },
    ]);
  };

  /** Deletes a single specific call log by its ID */
  const handleDelete = (id: string) => {
    Alert.alert("Delete Log", "Remove this call log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await CallLogService.deleteLog(id);
            setLogs((prev) => prev.filter((log) => log._id !== id));
          } catch (error) {
            console.error("Failed to delete log:", error);
          }
        },
      },
    ]);
  };

  /** Formats a call duration in seconds to MM:SS format */
  const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /** Formats the creation timestamp of a call log into a locale time string (e.g., 2:30 PM) */
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /** Starts a text chat conversation with the user from the call log */
  const navigateToChat = async (otherUser: any) => {
    if (!token) return;
    try {
      const conv: any = await chatService.getOrCreateConversation(token, otherUser.userId);
      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conv._id,
          recipientName: otherUser.name,
          recipientId: otherUser.userId,
          recipientImage: otherUser.profileImage || "",
        },
      });
    } catch (error) {
      console.error("Failed to navigate to chat", error);
      Alert.alert("Error", "Could not open chat conversation.");
    }
  };

  /** Renders an individual call log item in the FlatList */
  const renderItem = ({ item }: { item: any }) => {
    const isIncoming = item.direction === "INCOMING";
    const otherUser = isIncoming ? item.caller : item.receiver;
    const isMissed = item.status === "MISSED" || (item.status === "RINGING" && item.duration === 0);

    return (
      <TouchableOpacity style={styles.logItem} onPress={() => navigateToChat(otherUser)}>
        <View style={styles.avatarContainer}>
          {otherUser.profileImage ? (
            <Image source={{ uri: otherUser.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{otherUser.name.charAt(0)}</Text>
            </View>
          )}
        </View>

        <View style={styles.logDetails}>
          <Text style={[styles.name, isMissed && { color: "red" }]} numberOfLines={1}>
            {otherUser.name}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons 
              name={isIncoming ? "arrow-down-outline" : "arrow-up-outline"} 
              size={14} 
              color={isMissed ? "red" : "#666"} 
            />
            <Text style={styles.metaText}>{item.status}</Text>
            {item.duration > 0 && (
              <Text style={styles.metaText}> • {formatDuration(item.duration)}</Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => startCall(otherUser.userId, otherUser.name, otherUser.profileImage)} style={styles.actionBtn}>
              <Ionicons name="call-outline" size={20} color={BRAND_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call History</Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BRAND_COLOR} style={{ marginTop: 50 }} />
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="call-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No call history</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#111" },
  clearBtn: { padding: 5 },
  clearText: { color: "red", fontSize: 16, fontWeight: "500" },
  listContent: { padding: 15 },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: BRAND_COLOR },
  logDetails: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 13, color: "#666", marginLeft: 4, textTransform: "capitalize" },
  rightSection: { alignItems: "flex-end" },
  timeText: { fontSize: 12, color: "#999", marginBottom: 8 },
  actions: { flexDirection: "row" },
  actionBtn: { marginLeft: 15 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { marginTop: 15, fontSize: 16, color: "#999" },
});
