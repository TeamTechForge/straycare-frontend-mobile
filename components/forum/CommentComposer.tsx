import React, { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { forumStyles as styles } from "../../styles/forum.styles";

export default function CommentComposer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");

  return (
    <View style={styles.commentInputRow}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a comment..."
        style={styles.commentInput}
      />
      <Pressable onPress={() => { onSend(text); setText(""); }}>
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>
  );
}
