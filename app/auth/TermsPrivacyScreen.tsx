import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";

export default function TermsPrivacyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFromRegister = Object.keys(params).length > 0;

  const handleAgree = () => {
    // go back to signup with param and restore typed values
    router.replace({
      pathname: "/auth/Register",
      params: {
        ...params,
        agreed: "true"
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.header}>Terms & Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Section */}
        <View style={styles.card}>
          <Text style={styles.title}>1. Account Responsibility</Text>
          <Text style={styles.text}>
            Users must provide accurate information and keep credentials secure.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>2. Animal Reporting Rules</Text>
          <Text style={styles.text}>
            Only report real cases. False reports may result in restrictions.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>3. Communication Guidelines</Text>
          <Text style={styles.text}>
            Be respectful. Misuse of chat/calls will lead to action.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>4. Rescuer & Volunteer Conduct</Text>
          <Text style={styles.text}>
            All users must follow ethical animal welfare practices.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>5. Verification & Approvals</Text>
          <Text style={styles.text}>
            NGOs and vets may require admin approval.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>6. Data Usage & Privacy</Text>
          <Text style={styles.text}>
            Personal data is used only for app functionality and safety.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>7. Emergency Disclaimer</Text>
          <Text style={styles.text}>
            StrayCare supports rescue but does not guarantee outcomes.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>8. Account Suspension</Text>
          <Text style={styles.text}>
            Violations may result in suspension without prior notice.
          </Text>
        </View>
      </ScrollView>

      {isFromRegister && (
        <PrimaryButton
          title="I Agree and Continue"
          onPress={handleAgree}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    marginTop: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#f59e0b",
  },
  text: {
    fontSize: 13,
    color: "#333",
  },
});