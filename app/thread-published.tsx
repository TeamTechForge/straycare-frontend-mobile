import React from "react";
import { SafeAreaView, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AppButton from "../components/ui/AppButton";
import PublishedCard from "../components/thread/PublishedCard";
import { styles } from "../styles/threadPublished.styles";

export default function ThreadPublished() {
  const router = useRouter();
  const params = useLocalSearchParams<{ content?: string }>();

  const goToForum = () => {
    router.replace({
      pathname: "/discussion-forum",
      params: { newPost: params.content ?? "" },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <PublishedCard />
        <AppButton title="Done" onPress={goToForum} style={styles.doneBtn} />
      </View>
    </SafeAreaView>
  );
}
