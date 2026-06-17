import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../PrimaryButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<boolean>;
};

const REASON_OPTIONS = [
  "Spam",
  "Harassment",
  "Fake Information",
  "Animal Abuse Content",
  "Scam / Fraud",
  "Inappropriate Content",
  "Other",
];

export default function ReportUserModal({ visible, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (description.trim().length < 20) {
      Alert.alert("Error", "Please provide a description of at least 20 characters.");
      return;
    }

    setSubmitting(true);
    const success = await onSubmit(reason, description);
    setSubmitting(false);
    if (success) {
      setDescription("");
      setReason(REASON_OPTIONS[0]);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.header}>
                <Text style={styles.headerText}>Report User</Text>
                <TouchableOpacity onPress={onClose} disabled={submitting}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Select Reason</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={reason}
                  onValueChange={(itemValue) => setReason(itemValue)}
                  enabled={!submitting}
                  style={styles.picker}
                >
                  {REASON_OPTIONS.map((opt) => (
                    <Picker.Item key={opt} label={opt} value={opt} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Description (Minimum 20 characters)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe why you are reporting this user..."
                placeholderTextColor="#9CA3AF"
                editable={!submitting}
              />
              <Text style={styles.charCounter}>
                {description.length} characters (min 20)
              </Text>

              <View style={styles.buttonRow}>
                <PrimaryButton
                  title={submitting ? "Submitting..." : "Submit Report"}
                  onPress={handleSubmit}
                  disabled={submitting || description.trim().length < 20}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    textAlignVertical: "top",
    minHeight: 100,
  },
  charCounter: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "right",
  },
  buttonRow: {
    marginTop: 24,
  },
});
