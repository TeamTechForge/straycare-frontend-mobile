import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Link href="/communityFeed/communityPostMain" asChild>
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
            Go to community feed
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
