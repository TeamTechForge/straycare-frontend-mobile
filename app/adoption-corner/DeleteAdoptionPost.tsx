import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deletePost } from "@/services/adoptionService";

// ─── Standalone Delete Confirmation Screen ───────────────────────────────────

export default function DeleteConfirmScreen() {
  const router = useRouter();
  const { postId, postName } = useLocalSearchParams<{
    postId: string;
    postName: string;
  }>();

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deletePost(postId!);
      // Go back to listing after delete
      router.replace("/adoption-corner" as any);
    
    } catch {
      setDeleting(false);
      // Show inline error — no Alert so the screen stays visible
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.sheet}>
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <MaterialIcons name="delete-forever" size={40} color="#ba1a1a" />
        </View>

        {/* Text */}
        <Text style={styles.title}>Delete Post?</Text>
        <Text style={styles.subtitle}>
          Are you sure you want to delete{" "}
          <Text style={styles.petName}>{postName ?? "this post"}</Text>?
          {"\n"}This action cannot be undone.
        </Text>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            disabled={deleting}
          >
            <Text style={styles.cancelBtnText}>Keep Post</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            activeOpacity={0.85}
            disabled={deleting}
          >
            {deleting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.deleteBtnText}>Deleting...</Text>
              </View>
            ) : (
              <Text style={styles.deleteBtnText}>Yes, Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Reusable Delete Confirmation Modal ──────────────────────────────────────

export function DeleteConfirmModal({
  visible,
  postId,
  postName,
  onClose,
  onDeleted,
}: {
  visible: boolean;
  postId: string;
  postName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await deletePost(postId);
      onDeleted();
    } catch {
      setError("Failed to delete. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.iconWrapper}>
            <MaterialIcons name="delete-forever" size={40} color="#ba1a1a" />
          </View>

          <Text style={styles.title}>Delete Post?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to delete{" "}
            <Text style={styles.petName}>{postName}</Text>?
            {"\n"}This action cannot be undone.
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={15} color="#ba1a1a" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              disabled={deleting}
            >
              <Text style={styles.cancelBtnText}>Keep Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
              onPress={handleDelete}
              activeOpacity={0.85}
              disabled={deleting}
            >
              {deleting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.deleteBtnText}>Deleting...</Text>
                </View>
              ) : (
                <Text style={styles.deleteBtnText}>Yes, Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Screen (Option A)
  screen: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // Modal overlay (Option B)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // Bottom sheet
  sheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },

  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ffdad6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#131d21",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#807663",
    textAlign: "center",
    lineHeight: 22,
  },
  petName: {
    fontWeight: "700",
    color: "#131d21",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffdad6",
    borderRadius: 10,
    padding: 10,
    width: "100%",
  },
  errorText: { fontSize: 13, color: "#93000a", flex: 1 },

  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#807663",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#131d21" },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: "#ba1a1a",
    alignItems: "center",
    shadowColor: "#ba1a1a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
