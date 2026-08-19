// app/(tabs)/chats.tsx
// Chat list screen — shows all conversations with real-time updates.

import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import ConversationItem from "../../components/chat/ConversationItem";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { useChatApi } from "../../hooks/useChatApi";

const BRAND_COLOR = "#F5A623";

export default function ChatsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { socket, onlineUsers, hasUnseenMissedCalls } = useSocket();
    const { fetchConversations, deleteConversation } = useChatApi();

    const [conversations, setConversations] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleLongPressConversation = (conversationId: string) => {
        Alert.alert(
            "Delete Chat",
            "Are you sure you want to delete this chat? This will remove it from your chat list.",
            [
                {
                    text: "Delete Chat",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteConversation(conversationId);
                            setConversations((prev) => prev.filter((c) => c._id !== conversationId));
                        } catch (err) {
                            console.error("Failed to delete conversation:", err);
                            Alert.alert("Error", "Could not delete conversation. Please try again.");
                        }
                    },
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ]
        );
    };

    const loadConversations = useCallback(async () => {
        if (!user) return; // Do not fetch if user is logged out
        try {
            const data = await fetchConversations();
            setConversations(data as any[]);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchConversations]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Listen for new messages to update the conversation list in real-time
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            // Refresh the list when any new message arrives
            loadConversations();
        };

        const handleReadAck = () => {
            loadConversations();
        };

        socket.on("message:new", handleNewMessage);
        socket.on("message:read-ack", handleReadAck);

        return () => {
            socket.off("message:new", handleNewMessage);
            socket.off("message:read-ack", handleReadAck);
        };
    }, [socket, loadConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations();
    };

    const getOtherParticipant = (conversation: any) => {
        let other = conversation.participants?.find((p: any) => p && p._id !== user?._id);
        
        console.log(`[ChatList] Checking conv: type=${conversation.conversationType}, relatedEntity=`, conversation.relatedEntity);
        if (conversation.conversationType === "rescue" && conversation.relatedEntity) {
            let extractedId = conversation.relatedEntity.referenceId;
            if (!extractedId && conversation.relatedEntity.kind && conversation.relatedEntity.kind.includes('_')) {
                extractedId = conversation.relatedEntity.kind.split('_')[1];
            }
            let displayId = extractedId || (conversation.relatedEntity.item ? conversation.relatedEntity.item.toString().slice(-4) : 'Anon');
            if (displayId.length === 24) {
                displayId = displayId.slice(-4);
            }
            const isOtherRescuer = other?.role && ["rescuer", "ngo", "vet", "admin"].includes(other.role);
            const displayName = isOtherRescuer ? `Anonymous Report (${displayId})` : `Anonymous Reporter (${displayId})`;
            const displayAvatarName = isOtherRescuer ? `Anonymous+Report` : `Anonymous+Reporter`;

            return {
                _id: other?._id || "anon",
                name: displayName,
                role: "anonymous",
                profileImage: `https://ui-avatars.com/api/?name=${displayAvatarName}&background=FEB94B&color=fff`
            };
        }

        if (!other) {
            return {
                _id: "deleted",
                name: "Deleted User",
                role: "",
                profileImage: "https://ui-avatars.com/api/?name=Deleted+User&background=eaeaea&color=999"
            };
        }
        return other;
    };

    // Format time for display
    const formatTime = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: "short" });
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    // Filter conversations by search query
    const filtered = conversations.filter((conv) => {
        if (!search.trim()) return true;
        const other = getOtherParticipant(conv);
        return other?.name?.toLowerCase().includes(search.toLowerCase());
    });

    const renderItem = ({ item }: any) => {
        const other = getOtherParticipant(item);
        if (!other) return null;

        const unreadCount = (user?._id && item.unreadCounts?.[user._id]) || 0;

        return (
            <ConversationItem
                name={other.name || "Unknown"}
                lastMessage={item.lastMessage?.text || ""}
                time={formatTime(item.lastMessage?.createdAt)}
                unreadCount={unreadCount}
                isOnline={onlineUsers.has(other._id)}
                profileImage={other.profileImage}
                role={other.role}
                onPress={() =>
                    router.push({
                        pathname: "/chat/[conversationId]",
                        params: {
                            conversationId: item._id,
                            recipientName: other.name,
                            recipientId: other._id,
                            recipientImage: other.profileImage || "",
                        },
                    })
                }
                onLongPress={() => handleLongPressConversation(item._id)}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.title}>Chats</Text>

                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => router.push("/chat/New")} style={{ marginRight: 4 }}>
                        <Feather name="edit" size={22} color="#111" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/call-history" as any)} style={{ position: "relative" }}>
                        <Ionicons name="call" size={22} color="#333" />
                        {hasUnseenMissedCalls && <View style={styles.badgeDot} />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchBox}>
                <Feather name="search" size={18} color="#555" />
                <TextInput
                    placeholder="Search conversations"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                    placeholderTextColor="#777"
                />
            </View>

            {/* CONTENT */}
            {loading ? (
                <ActivityIndicator size="large" color={BRAND_COLOR} style={{ marginTop: 50 }} />
            ) : filtered.length === 0 ? (
                /* EMPTY STATE */
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="chatbubble-ellipses-outline" size={34} color={BRAND_COLOR} />
                    </View>
                    <Text style={styles.emptyTitle}>No chats yet</Text>
                    <Text style={styles.emptyText}>
                        Your rescue and support conversations will appear here once you start chatting.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
        borderColor: "#E5E7EB",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        backgroundColor: "#F9FAFB",
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#111",
    },
    listContent: {
        paddingBottom: 100,
    },
    badgeDot: {
        position: 'absolute',
        top: -2,
        right: -4,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#fff',
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