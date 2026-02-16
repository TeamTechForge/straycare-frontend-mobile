import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function ReportingIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* paw image icon */}
        <MaterialCommunityIcons
          name="paw"
          size={200}          
          color="#FFB700"
          style={{ marginBottom: 50, marginTop: 40 }}         />

        <Text style={styles.title}>Report a Stray Animal</Text>
        <Text style={styles.subtitle}>
          Help us take action by submitting a quick report.
        </Text>
      </ScrollView>

      {/* navigation bottom button */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title="Start Report →"
          onPress={() => router.push("/reporting/animal-details")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 160, 
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
