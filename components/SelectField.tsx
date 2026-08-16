import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Option = { label: string; value: string };

type Props = {
  label: string;
  placeholder: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: Option[];
  error?: string;
};

export default function SelectField({ label, placeholder, selectedValue, onValueChange, options, error }: Props) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label;

  const selectOption = (value: string) => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label.includes("*") ? (
            <>
              {label.replace("*", "").trim()}{" "}
              <Text style={styles.requiredStar}>*</Text>
            </>
          ) : (
            label
          )}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.selectButton, error && styles.selectError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel || placeholder}`}
      >
        <Text style={[styles.selectedText, !selectedLabel && styles.placeholderText]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label.replace("*", "").trim()}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel="Close options">
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.optionList}
              showsVerticalScrollIndicator={options.length > 6}
              renderItem={({ item }) => {
                const selected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.selectedOption]}
                    onPress={() => selectOption(item.value)}
                  >
                    <Text style={[styles.optionText, selected && styles.selectedOptionText]}>{item.label}</Text>
                    {selected && <Ionicons name="checkmark" size={19} color="#D97706" />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#333' },
  requiredStar: { color: '#DC2626' },
  selectButton: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectError: { borderColor: '#DC2626' },
  selectedText: { flex: 1, color: '#222', fontSize: 16, marginRight: 10 },
  placeholderText: { color: '#777' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E8DA',
  },
  modalTitle: { color: '#2D211C', fontSize: 17, fontWeight: '700' },
  optionList: { marginTop: 6 },
  option: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
  },
  selectedOption: { backgroundColor: '#FFF7E6' },
  optionText: { flex: 1, color: '#292524', fontSize: 15 },
  selectedOptionText: { color: '#B45309', fontWeight: '600' },
});
