import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";

export default function Index() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ marginBottom: 20 }}>
        Edit app/index.tsx to edit this screen.
      </Text>

      <PrimaryButton
        title="Go to Reporting Module"
        onPress={() => router.push("/reporting")}
      />
    </View>
  );
}
