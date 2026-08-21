import React from 'react';
import { TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type Props = {
  isLoading: boolean;
  isReady: boolean;
  onPress: () => void;
};

export default function GoogleSignInButton({ isLoading, isReady, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.googleButton, (isLoading || !isReady) && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={isLoading || !isReady}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#DB4437" style={styles.googleIcon} />
      ) : (
        <AntDesign name="google" size={18} color="#DB4437" style={styles.googleIcon} />
      )}
      <Text style={styles.googleButtonText}>
        {isLoading ? "Signing in..." : "Continue with Google"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FFF",
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
});
