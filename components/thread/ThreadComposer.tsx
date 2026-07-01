import React, { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { threadStyles as styles } from "../../styles/thread.styles";

export default function ThreadComposer({ onSend }: { onSend: (text: string) => void | Promise<void> }) {
  const [text, setText] = useState("");

  return (
    <View style={styles.composerRow}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a reply..."
        placeholderTextColor="#888"
        style={styles.composerInput}
      />
      <Pressable
        style={styles.composerBtn}
        onPress={async () => {
          await onSend(text);
          setText("");
        }}
      >
        <Text style={styles.composerBtnText}>Send</Text>
      </Pressable>
    </View>
  );
}
