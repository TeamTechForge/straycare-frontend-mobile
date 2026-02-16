import React from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/threadPublished.styles";

export default function PublishedCard() {
  return (
    <View style={styles.card}>
      <View style={styles.circleWrap}>
        <View style={styles.ring} />
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <View style={[styles.dot, styles.dotLeft]} />
        <View style={[styles.dot, styles.dotRight]} />
        <View style={[styles.dot, styles.dotBottom]} />
      </View>

      <Text style={styles.title}>Discussion Thread{"\n"}Published</Text>
    </View>
  );
}
