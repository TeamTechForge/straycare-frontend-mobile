import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import {
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Location() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Fake address as sample
  const fakeAddress =
    "50/C ,Main Street,Moratuwa ";

  // Draggable pin to mark location on map
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Image */}
        <View style={styles.mapContainer}>
          <Image
            source={{
              uri: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh5uV5RFBbnWplUwTcU4GbAp7SSH8BPgS-EgInU5LoqOWk3V8D_y4OlyvPF5jpbF7Hi5Q2paOtC7sZObkAfLkQj-7d-dXoVYmtMHEVP0fFGgE_66oqdJIgIt92J87feuEnh28M4iH7Elj8/s1600/google-traffic-sri-lanka.jpg",
            }}
            style={styles.mapImage}
          />

          {/* pin movable */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.pin, { transform: pan.getTranslateTransform() }]}
          >
            <Text style={styles.pinText}>📍</Text>
          </Animated.View>
        </View>

        <Text style={styles.label}>INCIDENT LOCATION</Text>
        <Text style={styles.address}>{fakeAddress}</Text>
      </ScrollView>

      {/* navigation bottom button */}
      <View style={styles.bottomButtonWrapper}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  scrollContent: {
    padding: 20,
    paddingBottom: 160, 
  },

  mapContainer: {
    height: 500, 
    borderRadius: 16,
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

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
