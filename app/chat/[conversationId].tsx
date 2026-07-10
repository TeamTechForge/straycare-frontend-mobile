// app/chat/[conversationId].tsx
// Chat room screen — messages, typing indicator, infinite scroll, optimistic updates.

import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatInput from "../../components/chat/ChatInput";
import MessageBubble from "../../components/chat/MessageBubble";
import TypingIndicator from "../../components/chat/TypingIndicator";
import LocationPickerModal from "../../components/chat/LocationPickerModal";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { useChat } from "../../hooks/useChat";
import { useChatApi } from "../../hooks/useChatApi";
import { API_URL } from "../../constants/config.constants";

const BRAND_COLOR = "#F5A623";

export default function ChatRoomScreen() {
  const router = useRouter();
  const { conversationId, recipientName, recipientId, recipientImage } = useLocalSearchParams<{
    conversationId: string;
    recipientName?: string;
    recipientId?: string;
    recipientImage?: string;
  }>();

  const { user, token } = useAuth();
  const { onlineUsers } = useSocket();
  const { setTyping, emitReadReceipt, onNewMessage, onTyping, onStopTyping, onReadAck, onDeleteMessage } =
    useChat(conversationId);
  const { fetchMessages, sendMessage, markAsRead, deleteMessage } = useChatApi();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingName, setOtherTypingName] = useState("");
  const flatListRef = useRef<FlatList>(null);
  
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const isSelectionMode = selectedMessages.size > 0;
  const insets = useSafeAreaInsets();

  // ── Load initial messages ──────────────────────────────────
  const loadMessages = useCallback(async () => {
    console.log(`[ChatRoomScreen] 🕒 Opening conversation: ${conversationId}, User: ${user?._id}`);
    try {
      const data = await fetchMessages(conversationId);
      console.log(`[ChatRoomScreen] 🕒 Messages loaded: ${data.length} messages fetched`);
      setMessages(data);
      setHasMore(data.length >= 30);
    } catch (error) {
      console.error("[ChatRoomScreen] ❌ Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, fetchMessages, user?._id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ── Mark messages as read when entering the screen ─────────
  useEffect(() => {
    if (!conversationId) return;
    markAsRead(conversationId).catch(console.error);
    emitReadReceipt();
  }, [conversationId]);

  // ── Real-time: new messages ────────────────────────────────
  useEffect(() => {
    const cleanup = onNewMessage(({ message, conversationId: msgConvId }) => {
      if (msgConvId !== conversationId) return;

      // Deduplicate (in case REST response already added it)
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [message, ...prev]; // newest first (inverted list)
      });

      // Auto-mark as read since user is viewing this conversation
      if (message.sender?._id !== user?._id && message.sender !== user?._id) {
        markAsRead(conversationId).catch(console.error);
        emitReadReceipt();
      }
    });

    return cleanup;
  }, [onNewMessage, conversationId, user?._id]);

  // ── Real-time: typing indicators ──────────────────────────
  useEffect(() => {
    const cleanupTyping = onTyping(({ conversationId: cid, userId }) => {
      if (cid !== conversationId || userId === user?._id) return;
      setIsOtherTyping(true);
      setOtherTypingName(recipientName || "");
    });

    const cleanupStopTyping = onStopTyping(({ conversationId: cid, userId }) => {
      if (cid !== conversationId || userId === user?._id) return;
      setIsOtherTyping(false);
    });

    return () => {
      cleanupTyping();
      cleanupStopTyping();
    };
  }, [onTyping, onStopTyping, conversationId, user?._id, recipientName]);

  // ── Real-time: read receipts ──────────────────────────────
  useEffect(() => {
    const cleanup = onReadAck(({ conversationId: cid, readBy }) => {
      if (cid !== conversationId) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.readBy?.includes(readBy)) {
            return { ...msg, readBy: [...(msg.readBy || []), readBy] };
          }
          return msg;
        })
      );
    });

    return cleanup;
  }, [onReadAck, conversationId]);

  // ── Real-time: message deletion ───────────────────────────
  useEffect(() => {
    const cleanup = onDeleteMessage(({ messageId, conversationId: cid }) => {
      if (cid !== conversationId) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                isDeletedForEveryone: true,
                text: "This message was deleted.",
                type: "text",
                imageUrl: undefined,
                location: undefined,
              }
            : msg
        )
      );
    });

    return cleanup;
  }, [onDeleteMessage, conversationId]);

  // ── Infinite scroll (load older messages) ─────────────────
  const loadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    try {
      const lastMessageId = messages[messages.length - 1]._id;
      const older = await fetchMessages(conversationId, lastMessageId);
      setMessages((prev) => [...prev, ...older]);
      setHasMore(older.length >= 30);
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Send text message (optimistic) ────────────────────────
  const handleSendText = async (text: string) => {
    // Optimistic insert
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optimisticMsg = {
      _id: tempId,
      conversationId,
      sender: { _id: user?._id, name: user?.name },
      text,
      type: "text",
      readBy: [user?._id],
      createdAt: new Date().toISOString(),
    };
    console.log(`[ChatRoomScreen] ✉️ Sending optimistic message: ${tempId}, Room: ${conversationId}, Sender: ${user?._id}`);

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      const sentMessage = await sendMessage({ conversationId, text, type: "text" });
      console.log(`[ChatRoomScreen] ✅ Message sent successfully. Real ID: ${sentMessage._id}`);

      // Replace optimistic message with server response, deduplicating if socket beat us to it
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m._id === sentMessage._id);
        if (alreadyExists) {
          // Socket event arrived first, remove the temporary message
          return prev.filter((m) => m._id !== tempId);
        } else {
          // REST response arrived first, replace temp with real
          return prev.map((m) => (m._id === tempId ? sentMessage : m));
        }
      });
    } catch (error) {
      console.error("[ChatRoomScreen] ❌ Send message failed:", error);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // ── Send image messages ────────────────────────────────────
  const handleSendImages = async (uris: string[]) => {
    for (const uri of uris) {
      try {
        const formData = new FormData();
        formData.append("file", {
          uri,
          name: "chat_image.jpg",
          type: "image/jpeg",
        } as any);

        const uploadRes = await fetch(`${API_URL}/upload/cloudinary`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }

        const { url: imageUrl } = await uploadRes.json();

        await sendMessage({
          conversationId,
          type: "image",
          imageUrl,
          text: "",
        });
      } catch (error) {
        console.error("Image send failed:", error);
        Alert.alert("Error", "Failed to send one or more images. Please try again.");
      }
    }
  };

  const handleLongPressMessage = (message: any) => {
    if (message.isDeletedForEveryone) return;
    const newSet = new Set(selectedMessages);
    newSet.add(message._id);
    setSelectedMessages(newSet);
  };

  const handlePressMessage = (message: any) => {
    if (isSelectionMode) {
      const newSet = new Set(selectedMessages);
      if (newSet.has(message._id)) {
        newSet.delete(message._id);
      } else {
        if (!message.isDeletedForEveryone) {
          newSet.add(message._id);
        }
      }
      setSelectedMessages(newSet);
    } else {
      if (message.type === "image" && message.imageUrl) {
        setActiveImageUrl(message.imageUrl);
      }
    }
  };

  const handleDeleteSelected = async (type: "me" | "everyone") => {
    setIsDeleteModalVisible(false);
    const ids = Array.from(selectedMessages);
    setSelectedMessages(new Set());

    // Optimistically update
    if (type === "me") {
      setMessages((prev) => prev.filter((m) => !ids.includes(m._id)));
    } else if (type === "everyone") {
      setMessages((prev) =>
        prev.map((m) =>
          ids.includes(m._id)
            ? { ...m, isDeletedForEveryone: true, text: "This message was deleted.", imageUrl: null, location: null }
            : m
        )
      );
    }

    // Call API for each
    for (const id of ids) {
      try {
        await deleteMessage(id, type);
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    }
  };

  const canDeleteForEveryone = Array.from(selectedMessages).every((id) => {
    const msg = messages.find((m) => m._id === id);
    return msg && (msg.sender?._id || msg.sender) === user?._id;
  });

  // ── Send location message ─────────────────────────────────
  const handleSendLocation = async (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    try {
      await sendMessage({
        conversationId,
        type: "location",
        location,
        text: "",
      });
    } catch (error) {
      console.error("Location send failed:", error);
      Alert.alert("Error", "Failed to share location.");
    }
  };

  const handleDeleteMessage = async (messageId: string, type: "me" | "everyone") => {
    try {
      await deleteMessage(messageId, type);
      if (type === "me") {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  isDeletedForEveryone: true,
                  text: "This message was deleted.",
                  type: "text",
                  imageUrl: undefined,
                  location: undefined,
                }
              : msg
          )
        );
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
      Alert.alert("Error", "Could not delete message. Please try again.");
    }
  };



  // ── Format time ───────────────────────────────────────────
  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if a message has been read by the other participant
  const isReadByOther = (msg: any) => {
    if (!recipientId) return false;
    return msg.readBy?.includes(recipientId);
  };

  const renderMessage = ({ item, index }: any) => {
    const isMine =
      (item.sender?._id || item.sender) === user?._id;

    return (
      <MessageBubble
        text={item.text}
        time={formatTime(item.createdAt)}
        isMine={isMine}
        isRead={isReadByOther(item)}
        type={item.type}
        imageUrl={item.imageUrl}
        location={item.location}
        showTail={true}
        onLongPress={() => handleLongPressMessage(item)}
        onPress={() => handlePressMessage(item)}
        isSelected={selectedMessages.has(item._id)}
        isDeletedForEveryone={item.isDeletedForEveryone}
      />
    );
  };

  const isRecipientOnline = recipientId ? onlineUsers.has(recipientId) : false;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
      >
      {/* Header */}
      {isSelectionMode ? (
        <View style={[styles.selectionHeader, { paddingTop: Math.max(insets.top, 20) }]}>
          <View style={styles.selectionHeaderLeft}>
            <TouchableOpacity onPress={() => setSelectedMessages(new Set())} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.selectionTitle}>{selectedMessages.size} Selected</Text>
          </View>
          <TouchableOpacity onPress={() => setIsDeleteModalVisible(true)} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <ChatHeader
          name={recipientName || "Chat"}
          isOnline={isRecipientOnline}
          profileImage={recipientImage}
          onTitlePress={() => {
            if (recipientId) {
              router.push(`/profile/${recipientId}`);
            }
          }}
          onCallPress={() => Alert.alert("Coming Soon", "Voice calling will be available in Phase 2.")}
        />
      )}

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND_COLOR} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          inverted
          contentContainerStyle={styles.messageList}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={BRAND_COLOR}
                style={{ paddingVertical: 10 }}
              />
            ) : null
          }
          ListHeaderComponent={
            isOtherTyping ? <TypingIndicator userName={otherTypingName} /> : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <ChatInput
        onSendText={handleSendText}
        onSendImages={handleSendImages}
        onSendLocation={handleSendLocation}
        onChooseLocation={() => setIsLocationPickerVisible(true)}
        onTyping={(isTyping) => setTyping(isTyping)}
        disabled={loading}
      />
      </KeyboardAvoidingView>
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDeleteModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="trash-bin" size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Messages</Text>
            <Text style={styles.modalDesc}>This action cannot be undone.</Text>
            
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDestructive]} 
                onPress={() => handleDeleteSelected("me")}
              >
                <Text style={styles.modalButtonTextDestructive}>Delete for Me</Text>
              </TouchableOpacity>

              {canDeleteForEveryone && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonDestructive]} 
                  onPress={() => handleDeleteSelected("everyone")}
                >
                  <Text style={styles.modalButtonTextDestructive}>Delete for Everyone</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <LocationPickerModal
        visible={isLocationPickerVisible}
        onClose={() => setIsLocationPickerVisible(false)}
        onSelectLocation={handleSendLocation}
      />

      <Modal
        visible={!!activeImageUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveImageUrl(null)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={() => setActiveImageUrl(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {activeImageUrl && (
            <Image
              source={{ uri: activeImageUrl }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#EFF6FF",
    borderBottomWidth: 1,
    borderBottomColor: "#BFDBFE",
  },
  selectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  iconButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtonGroup: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  modalButtonDestructive: {
    backgroundColor: "#FEF2F2",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
  modalButtonTextDestructive: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: "100%",
    height: "80%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageList: {
    paddingVertical: 8,
  },
});
