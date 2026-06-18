import React, { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { forumStyles as styles } from "../../styles/forum.styles";

/**
 * Comment input row with rounded TextInput and primary Send button.
 */
export default function CommentComposer({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View style={styles.commentInputRow}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a comment…"
        placeholderTextColor="#BBBBBB"
        style={styles.commentInput}
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />
      <Pressable style={styles.sendBtn} onPress={handleSend}>
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>
  );
}
