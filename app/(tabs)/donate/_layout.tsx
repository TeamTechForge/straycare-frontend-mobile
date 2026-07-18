import { Stack } from 'expo-router';

export default function DonateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hides the default top header for all donation sub-pages
      }}
    >
      {/* 
        This registers all files in the donate folder under a single Stack navigator.
        The name must match the filename without the extension (e.g. index, history, etc.)
      */}
      <Stack.Screen name="index" />
      <Stack.Screen name="donationSummary" />
      <Stack.Screen name="donationSuccess" />
      <Stack.Screen name="history" />
      <Stack.Screen name="payhereCheckout" />
      <Stack.Screen name="receipt" />
      <Stack.Screen name="receivedDonations" />
    </Stack>
  );
}