import { Stack } from 'expo-router';

export default function DonateLayout() {
  return (
    // Group all donation screens in one navigation stack.
    <Stack screenOptions={{ headerShown: false }}>
      {/* Each screen uses its own title and back button. */}
      <Stack.Screen name="DonationSummary" />
      <Stack.Screen name="PayhereCheckout" />
      <Stack.Screen name="DonationSuccess" />
      {/* History, receipts and received donations are part of the same flow. */}
      <Stack.Screen name="History" />
      <Stack.Screen name="Receipt" />
      <Stack.Screen name="ReceivedDonations" />
      <Stack.Screen name="DonationHub" />
    </Stack>
  );
}
