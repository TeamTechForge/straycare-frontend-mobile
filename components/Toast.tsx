import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onDismiss?: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [opacity] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        onDismiss?.();
      });
    }
  }, [message, opacity, duration, onDismiss]);

  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      case "info":
        return "#2196F3";
      default:
        return "#333";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(), opacity },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 999,
  },
  message: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
