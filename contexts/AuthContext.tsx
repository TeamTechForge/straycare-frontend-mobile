// contexts/AuthContext.tsx
// Global auth state — avoids repeated SecureStore reads across screens.

import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../constants/Config";
import { clearGoogleSession } from "../services/googleAuthService";

type UserData = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profileCompleted?: boolean;
  roleSelected?: boolean;
  isApproved?: boolean;
  profileStatus?: "Pending" | "Verified" | "Rejected";
  messagingPrivacy?: string;
  callingPrivacy?: string;
};

type AuthContextType = {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("authToken");
      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(storedToken);

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        let profileStatus: "Pending" | "Verified" | "Rejected" = "Pending";

        if (data.role === "ngo" || data.role === "vet") {
          try {
            const profileRes = await fetch(`${API_URL}/profiles/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              profileStatus = profileData.status || "Pending";
            }
          } catch (profileErr) {
            console.error("[AuthContext] Error fetching profile status:", profileErr);
          }
        }

        setUser({ ...data, profileStatus });
      } else {
        // Token invalid/expired
        setUser(null);
        setToken(null);
        await SecureStore.deleteItemAsync("authToken");
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    await clearGoogleSession();
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    // Load and restore user session from SecureStore on startup
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
