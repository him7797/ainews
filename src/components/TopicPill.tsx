import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TopicPillProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export default function TopicPill({ label, isSelected, onPress }: TopicPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, isSelected ? styles.selectedPill : styles.unselectedPill]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isSelected ? styles.selectedText : styles.unselectedText]}>
        {label}
        {isSelected && ' ✓'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 10,
    marginBottom: 12,
  },
  selectedPill: {
    backgroundColor: '#4361EE',
  },
  unselectedPill: {
    backgroundColor: '#F1F5F9',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  unselectedText: {
    color: '#0F172A',
  },
});
