import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DropdownOption = {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  options: DropdownOption[];
};

export default function DropdownMenu({ visible, onClose, options }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.menuContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionRow,
                  index < options.length - 1 && styles.borderBottom,
                ]}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={option.destructive ? "#EF4444" : "#374151"}
                  style={styles.optionIcon}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    option.destructive && styles.destructiveText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    marginTop: 60, // Adjust to position near header
    marginRight: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    minWidth: 180,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  destructiveText: {
    color: "#EF4444",
  },
});
