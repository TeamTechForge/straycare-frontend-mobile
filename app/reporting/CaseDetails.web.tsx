import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getReportByCaseId } from "../../api/stray-api.service";
import PrimaryButton from "../../components/PrimaryButton";

type Report = {
  caseId: string;
  animalType: string;
  breed?: string;
  category: string;
  status: string;
  notes?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Needs Help":
      return "#ff6b6b";
    case "Under Rescue":
      return "#ffd93d";
    case "Treated":
      return "#6bcf7f";
    case "Ready for Adoption":
      return "#4d96ff";
    default:
      return "#999";
  }
};

export default function CaseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const safe = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";

  const caseId = safe(params.caseId);

  useEffect(() => {
    (async () => {
      try {
        const data = await getReportByCaseId(caseId);
        setReport(data);
      } catch (err) {
        console.error("Error loading case:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Case not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{report.animalType}</Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(report.status) },
          ]}
        >
          <Text style={styles.statusText}>{report.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{report.category}</Text>
        </View>

        {report.breed && (
          <View style={styles.section}>
            <Text style={styles.label}>Breed:</Text>
            <Text style={styles.value}>{report.breed}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{report.location.address}</Text>
        </View>

        {report.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{report.notes}</Text>
          </View>
        )}

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>
            📍 Map view available on mobile app
          </Text>
        </View>

        <PrimaryButton
          title="Back to Cases"
          onPress={() => router.push("/reporting")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#666",
  },
  mapPlaceholder: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  mapText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
  },
});
