
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Link href="/lostAndFound/lostFoundMain" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: "orange",
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 8,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Go to Lost and Found
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const BRAND_COLOR = "#F5A623";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",   // 🔹 CHANGED background color
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 0,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },

  // 🔹 NEW image card container
  imageCard: {
    width: "100%",
    height: 260,
    backgroundColor: "#E8A167",  // orange card background
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    
  },

  dogImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 30,
    
  },

  // 🔹 NEW heading style
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 10,
  },

  // 🔹 NEW highlight style
  highlight: {
    color: BRAND_COLOR,
  },

  // 🔹 NEW subtitle style
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },

  // 🔹 NEW button container
  buttonContainer: {
    width: "100%",
  },
});
