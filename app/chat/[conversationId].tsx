// app/chat/[conversationId].tsx
// Chat room screen — messages, typing indicator, infinite scroll, optimistic updates.

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatInput from "../../components/chat/ChatInput";
import MessageBubble from "../../components/chat/MessageBubble";
import TypingIndicator from "../../components/chat/TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { useChat } from "../../hooks/useChat";
import { useChatApi } from "../../hooks/useChatApi";
import { API_URL } from "../../constants/Config";

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
    const tempId = `temp-${Date.now()}`;
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

      // Replace optimistic message with server response
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? sentMessage : m))
      );
    } catch (error) {
      console.error("[ChatRoomScreen] ❌ Send message failed:", error);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // ── Send image message ────────────────────────────────────
  const handleSendImage = async (uri: string) => {
    try {
      // Upload to Cloudinary via the existing upload endpoint
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
        let errorMsg = "Image upload failed";
        try {
          const errorData = await uploadRes.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          // use default error message
        }
        throw new Error(errorMsg);
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
      Alert.alert("Error", "Failed to send image. Please try again.");
    }
  };

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

  const handleLongPressMessage = (message: any) => {
    const isMine = (message.sender?._id || message.sender) === user?._id;

    if (isMine) {
      Alert.alert(
        "Delete Message",
        "Choose an option to delete this message.",
        [
          {
            text: "Delete for Me",
            onPress: () => handleDeleteMessage(message._id, "me"),
          },
          {
            text: "Delete for Everyone",
            style: "destructive",
            onPress: () => handleDeleteMessage(message._id, "everyone"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      Alert.alert(
        "Delete Message",
        "Do you want to delete this message for yourself?",
        [
          {
            text: "Delete for Me",
            style: "destructive",
            onPress: () => handleDeleteMessage(message._id, "me"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
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
        isDeletedForEveryone={item.isDeletedForEveryone}
      />
    );
  };

  const isRecipientOnline = recipientId ? onlineUsers.has(recipientId) : false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
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
        onSendImage={handleSendImage}
        onSendLocation={handleSendLocation}
        onTyping={(isTyping) => setTyping(isTyping)}
        disabled={loading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
