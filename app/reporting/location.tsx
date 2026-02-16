import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import {
    Animated,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Location() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Fake address (same as before)
  const fakeAddress =
    "124 Maple Street, Northside, Springfield, Illinois 62704";

  // Draggable pin position
  const pan = useRef(new Animated.ValueXY({ x: 150, y: 120 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Map Image */}
      <View style={styles.mapContainer}>
        <Image
          source={{
            uri: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh5uV5RFBbnWplUwTcU4GbAp7SSH8BPgS-EgInU5LoqOWk3V8D_y4OlyvPF5jpbF7Hi5Q2paOtC7sZObkAfLkQj-7d-dXoVYmtMHEVP0fFGgE_66oqdJIgIt92J87feuEnh28M4iH7Elj8/s1600/google-traffic-sri-lanka.jpg", 
          }}
          style={styles.mapImage}
        />

        {/* Movable Pin */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.pin, { transform: pan.getTranslateTransform() }]}
        >
          <Text style={styles.pinText}>📍</Text>
        </Animated.View>
      </View>

      <Text style={styles.label}>INCIDENT LOCATION</Text>
      <Text style={styles.address}>{fakeAddress}</Text>

      <PrimaryButton
        title="Continue Report →"
        onPress={() =>
          router.push({
            pathname: "/reporting/review",
            params: { ...params, location: fakeAddress },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  mapImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pin: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pinText: {
    fontSize: 32,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#444" },
  address: { fontSize: 16, marginBottom: 20 },
});
