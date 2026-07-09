import React from "react";
import { View, TextInput } from "react-native";
import { styles } from "../../styles/addContent.styles";

type Props = {
  value: string;
  onChange: (text: string) => void;
};

export default function ContentInputCard({ value, onChange }: Props) {
  return (
    <View style={styles.inputCard}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Write something..."
        placeholderTextColor="#888"
        style={styles.input}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}
