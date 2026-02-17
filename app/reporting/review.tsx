import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

const reviewImages = [
  "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/387B/production/_126795441_gettyimages-979935038-170667a.jpg",
  "https://c.files.bbci.co.uk/b068/live/a52cf990-87d4-11f0-b391-6936825093bd.jpg",
  "https://www.worldanimalprotection.ca/cdn-cgi/image/width=1280,format=auto/siteassets/article/dog_kenya_1700x958_1021132.jpg",
  "https://c.ndtvimg.com/2025-08/1dkjog7c_stray-dogs_625x300_12_August_25.jpg?im=FeatureCrop,algorithm=dnn,width=1200,height=738",
  "https://www.livemint.com/lm-img/img/2025/08/22/600x338/Dog-Celebration-8_1755881725546_1755881739279.jpg",
];

export default function Review() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const caseId =
    params.caseId ||
    "STRAY-" + Math.floor(10000 + Math.random() * 90000);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* case id */}
      <View style={styles.caseCard}>
        <Text style={styles.caseLabel}>CASE ID</Text>
        <Text style={styles.caseValue}>{caseId}</Text>
      </View>

      {/* main first image to show */}
      <Image source={{ uri: reviewImages[0] }} style={styles.mainPhoto} />

      {/* other images */}
      <View style={styles.grid}>
        {reviewImages.slice(1).map((url, index) => (
          <Image key={index} source={{ uri: url }} style={styles.smallPhoto} />
        ))}
      </View>

      {/* animal detail section-navigate to report form */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Animal Details</Text>

        {/* button to edit  */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/reporting/animal-details",
              params,
            })
          }
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>{params.animalType}</Text>

        <Text style={styles.label}>Breed</Text>
        <Text style={styles.value}>{params.breed || "Not specified"}</Text>

        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{params.status}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{params.notes}</Text>

        <Text style={styles.label}>Anonymous</Text>
        <Text style={styles.value}>
          {params.anonymous === "true" ? "Yes" : "No"}
        </Text>
      </View>

      {/* location part */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rescue Location</Text>

        {/* button to edit location-navigate to location page */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/reporting/location",
              params,
            })
          }
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.value}>{params.location}</Text>
      </View>

      <PrimaryButton
        title="Submit Report"
        onPress={() =>
          router.push({
            pathname: "/reporting/success",
            params: { caseId },
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: "#fafafa",
  },

  caseCard: {
    backgroundColor: "#FFF4D1",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  caseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  caseValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  mainPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },

  smallPhoto: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  editText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  infoBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center", 
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    color: "#444",
    textAlign: "center",
  },

  value: {
    fontSize: 16,
    marginTop: 2,
    textAlign: "center",
  },
});
