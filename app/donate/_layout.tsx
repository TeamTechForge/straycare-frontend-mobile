import { Stack } from 'expo-router';

export default function DonateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DonationSummary" />
      <Stack.Screen name="PayhereCheckout" />
      <Stack.Screen name="DonationSuccess" />
      <Stack.Screen name="History" />
      <Stack.Screen name="Receipt" />
      <Stack.Screen name="ReceivedDonations" />
      <Stack.Screen name="DonationHub" />
    </Stack>
  );
}