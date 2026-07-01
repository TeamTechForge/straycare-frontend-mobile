import { StyleSheet, Text, View } from "react-native";

export default function FormSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        {title.includes("*") ? (
          <>
            {title.replace("*", "")}
            <Text style={{ color: "red" }}>*</Text>
          </>
        ) : (
          title
        )}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 10,
  },
});