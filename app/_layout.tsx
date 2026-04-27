/*import { Stack } from "expo-router";

export default function RootLayout() {
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
        headerShown: false,
      }}
    />
  );
}
