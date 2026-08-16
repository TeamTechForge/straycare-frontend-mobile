import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, Text } from "react-native";
import { forumStyles as styles } from "../../styles/forum.styles";

/**
 * Comment input row with rounded TextInput and primary Send button.
 */
export default function CommentComposer({
  onSend,
  disabled = false,
  multiline = false,
}: {
  onSend: (text: string) => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
  multiline?: boolean;
}) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const result = await onSend(trimmed);
    if (result !== false) setText("");
  };

  return (
    <View style={[styles.commentInputRow, multiline && localStyles.multilineRow]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a comment…"
        placeholderTextColor="#BBBBBB"
        style={[styles.commentInput, multiline && localStyles.multilineInput]}
        multiline={multiline}
        maxLength={1000}
        editable={!disabled}
        textAlignVertical="top"
        returnKeyType={multiline ? "default" : "send"}
        onSubmitEditing={multiline ? undefined : () => void handleSend()}
      />
      <Pressable
        style={[styles.sendBtn, (!text.trim() || disabled) && { opacity: 0.45 }]}
        onPress={() => void handleSend()}
        disabled={!text.trim() || disabled}
      >
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>
  );
}

const localStyles = StyleSheet.create({
  multilineRow: { alignItems: "flex-end" },
  multilineInput: { minHeight: 44, maxHeight: 120 },
});
