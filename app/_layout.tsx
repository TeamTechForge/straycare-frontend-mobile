// Root layout for the app, defining the navigation stack and global providers.
import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Stack
          screenOptions={{
            headerShown: false, // Disable default header for all screens
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );
}
