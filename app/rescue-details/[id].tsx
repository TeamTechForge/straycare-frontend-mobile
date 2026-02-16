import React from "react";
import { SafeAreaView, View, Text, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AppButton from "../../components/ui/AppButton";
import InfoRow from "../../components/ui/InfoRow";
import { spacing } from "../../constants/spacing";
import { rescueDetailsStyles as styles } from "../../styles/rescueDetails.styles";

// sample data
const RESCUE_DETAILS: Record<string, any> = {
  "001": {
    image: "https://placedog.net/400/400?id=1",
    date: "12 Jan 2026",
    location: "Borella, Colombo",
    type: "Injury",
    rescuer: "Embark",
    outcomes: ["Treated and released", "Admitted to shelter", "Transferred to veterinary clinic"],
  },
  "002": {
    image: "https://placedog.net/400/400?id=2",
    date: "08 Jan 2026",
    location: "Kandy",
    type: "Sick",
    rescuer: "Hope Paws NGO",
    outcomes: ["Checked by vet", "Medicine given"],
  },
  "003": {
    image: "https://placedog.net/400/400?id=3",
    date: "02 Jan 2026",
    location: "Galle",
    type: "Accident",
    rescuer: "StreetCare",
    outcomes: ["Admitted to clinic", "Under observation"],
  },
};

export default function RescueDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const details = RESCUE_DETAILS[id ?? "001"] ?? RESCUE_DETAILS["001"];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>Rescue ID : {id}</Text>

          <View style={styles.imageWrap}>
            <Image source={{ uri: details.image }} style={styles.image} />
          </View>

          <InfoRow label="Rescue Date" value={details.date} />
          <InfoRow label="Location" value={details.location} />
          <InfoRow label="Case Type" value={details.type} />
          <InfoRow label="Rescuer / NGO name" value={details.rescuer} />

          <View style={styles.outcomeBox}>
            <Text style={styles.outcomeTitle}>Outcome Summary :</Text>
            <View style={styles.outcomeInner}>
              {details.outcomes.map((o: string, idx: number) => (
                <Text key={idx} style={styles.outcomeText}>
                  {o}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <AppButton title="Exit" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}
