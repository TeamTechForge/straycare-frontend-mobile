import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton, AppInput } from "../../components";
import typography from "../../constants/typography";

export default function Form() {
  const router = useRouter();

  const [animal, setAnimal] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleNext = () => {
    router.push({
      pathname: "./review",
      params: { animal, location, description },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report a Case</Text>

      <AppInput placeholder="Animal type" value={animal} onChangeText={setAnimal} />
      <AppInput placeholder="Location" value={location} onChangeText={setLocation} />
      <AppInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <AppButton title="Review Report" onPress={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    marginBottom: 20,
  },
});
