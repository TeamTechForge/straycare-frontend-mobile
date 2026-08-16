import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const C = {
  white: "#FFFFFF",
  text: "#121C2C",
  textSecondary: "#4D4637",
  outline: "#7F7665",
  orange: "#F28C28",
  lightOrange: "#FFF2E2",
  darkOrange: "#B75D00",
};

const REPORT_REASONS = [
  "Misleading or sensational",
  "Violent or repulsive",
  "Hateful or abusive",
  "Intrusive or too personal",
  "Spam or irrelevant",
  "Other",
];

export interface ReportPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
}

export default function ReportPostModal({
  visible,
  onClose,
  onSubmit,
}: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setSelectedReason("");
    setOtherReason("");
    onClose();
  };

  const handleSelectReason = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== "Other") {
      setOtherReason("");
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Select a reason", "Please select a reason for reporting this post.");
      return;
    }

    if (selectedReason === "Other" && !otherReason.trim()) {
      Alert.alert("Enter a reason", "Please type your report reason.");
      return;
    }

    const finalReason =
      selectedReason === "Other" ? otherReason.trim() : selectedReason;

    try {
      setSubmitting(true);
      await onSubmit(finalReason);
      setSelectedReason("");
      setOtherReason("");
      onClose();
    } catch (error) {
      console.error("Report submission error:", error);
      Alert.alert("Report Failed", "Unable to submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Submit a report</Text>
              <Text style={styles.description}>
                Tell us why you are reporting this post.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              disabled={submitting}
              onPress={handleClose}
            >
              <MaterialIcons name="close" size={23} color={C.outline} />
            </TouchableOpacity>
          </View>

          {/* Reasons List */}
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                activeOpacity={0.7}
                onPress={() => handleSelectReason(reason)}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[styles.reasonText, isSelected && styles.reasonTextSelected]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Custom Input for 'Other' */}
          {selectedReason === "Other" && (
            <View style={styles.otherInputWrapper}>
              <Text style={styles.otherInputLabel}>Tell us your reason</Text>
              <TextInput
                style={styles.otherInput}
                placeholder="Type your reason here..."
                placeholderTextColor="#999999"
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
                maxLength={300}
              />
              <Text style={styles.characterCount}>{otherReason.length}/300</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              disabled={submitting}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason ||
                  submitting ||
                  (selectedReason === "Other" && !otherReason.trim())) &&
                  styles.submitButtonDisabled,
              ]}
              disabled={
                !selectedReason ||
                submitting ||
                (selectedReason === "Other" && !otherReason.trim())
              }
              activeOpacity={0.8}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Submitting..." : "Report"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 44, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },
  description: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  reasonRowSelected: {
    backgroundColor: C.lightOrange,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.outline,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: C.orange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.orange,
  },
  reasonText: {
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  reasonTextSelected: {
    fontWeight: "600",
    color: C.darkOrange,
  },
  otherInputWrapper: {
    marginTop: 8,
    marginBottom: 12,
  },
  otherInputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 6,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: C.outline,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.text,
    minHeight: 70,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 11,
    color: C.outline,
    textAlign: "right",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: C.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
  },
});