import { Stack } from "expo-router";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
  });

  // Wait until fonts load
  if (!fontsLoaded) {
    return null;
  }

  return <Stack />;
}*/

/*
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden />
      <Stack />
    </>
  );
}*/
import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable default header for all screens
      }}
    />
  );
}
