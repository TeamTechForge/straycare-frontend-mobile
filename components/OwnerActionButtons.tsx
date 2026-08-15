import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OwnerActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  containerStyle?: object;
}

export default function OwnerActionButtons({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  containerStyle,
}: OwnerActionButtonsProps) {
  return (
    <View style={[styles.ownerActions, containerStyle]}>
      <TouchableOpacity style={[styles.ownerBtn, styles.editBtn]} onPress={onEdit}>
        <Ionicons name="pencil" size={16} color="#062425" />
        <Text style={styles.editText}>{editLabel}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.ownerBtn, styles.deleteBtn]} onPress={onDelete}>
        <Ionicons name="trash" size={16} color="#FF5A5A" />
        <Text style={styles.deleteText}>{deleteLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ownerActions: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    paddingTop: 16,
    justifyContent: 'space-between',
    gap: 12,
  },
  ownerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#f4f3f3',
  },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#062425',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5A5A',
  },
});
