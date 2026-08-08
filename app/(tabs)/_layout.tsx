import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '../../contexts/SocketContext';

const BRAND_COLOR = "#F5A623";
const TAB_BAR_BG = "#FFF7E6";

//file defines the bottom tab navigation for the StrayCare app.

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { hasUnreadChats } = useSocket();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND_COLOR,
        tabBarInactiveTintColor: '#000000ff',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 65 + insets.bottom : 70,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 18,
          paddingTop: 10,
          backgroundColor: TAB_BAR_BG,
          borderTopWidth: 1,
          borderTopColor: '#fde7c7',
          elevation: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Community Tab */}
      <Tabs.Screen
        name="CommunityFeed"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Report Tab (Center Action Tab) */}
      <Tabs.Screen
        name="Report"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.centerTabContainer}>
              <View style={styles.centerTab}>
                <Ionicons name="map" size={28} color="#fff" />
              </View>
            </View>
          ),
        }}
      />

      {/*  Chat Tab */}
      <Tabs.Screen
        name="Chats"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={24} color={color} />
              {hasUnreadChats && <View style={styles.badgeDot} />}
            </View>
          ),
        }}
      />

      {/*  Profile Tab */}
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Donate Flow (Hidden from Tab Bar) */}
      <Tabs.Screen
        name="Donate"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerTabContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTab: {
    backgroundColor: BRAND_COLOR,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF7E6',
  },
});
