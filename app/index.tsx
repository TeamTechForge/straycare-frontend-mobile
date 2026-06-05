
import PrimaryButton from "@/components/PrimaryButton";
import { Link, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomePage() {
  const router = useRouter();

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

      <Link href="/communityFeed/communityPostMain" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: "purple",
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 8,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Go to Community Feed
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
    <View style={styles.container}>
      
      {/* TOP LOGO SECTION */}
      <Image
        source={require("../assets/images/straycarelogo.png")}
        style={styles.logo}
      />

      {/* IMAGE CARD SECTION */}
      <View style={styles.imageCard}>
        <Image
          source={require("../assets/images/welocmepageimg.jpg")} // ← your dog image
          style={styles.dogImage}
        />
      </View>

      {/* MAIN HEADLINE */}
      <Text style={styles.heading}>
        Every animal{"\n"}
        <Text style={styles.highlight}>deserves a home.</Text>
      </Text>

      {/*  SUBTITLE */}
      <Text style={styles.subtitle}>
        Coordinate rescues, report strays, and{"\n"}
        support animal welfare in your community.
      </Text>

      {/*  BUTTONS */}
      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Create Account"
          onPress={() => router.push("/auth/register")}
        />

        <PrimaryButton
          title="Login"
          variant="outline"
          onPress={() => router.push("/auth/login")}
        />
      </View>

    </View>
  );
}

const BRAND_COLOR = "#F5A623";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",   
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

  // NEW image card container
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

  // NEW heading style
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 10,
  },

  //  NEW highlight style
  highlight: {
    color: BRAND_COLOR,
  },

  //  NEW subtitle style
  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },

  //  NEW button container
  buttonContainer: {
    width: "100%",
  },
});
