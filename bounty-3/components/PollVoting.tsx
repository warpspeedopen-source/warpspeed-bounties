import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Poll } from '../types';

interface PollVotingProps {
  poll: Poll;
  currentUserId: string;
  currentUsername: string;
  onVote: (pollId: string, optionIds: string[]) => void;
}

export const PollVoting: React.FC<PollVotingProps> = ({
  poll,
  currentUserId,
  currentUsername,
  onVote,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleOption = useCallback(
    (optionId: string) => {
      if (poll.isMultiChoice) {
        setSelectedIds((prev) =>
          prev.includes(optionId)
            ? prev.filter((id) => id !== optionId)
            : [...prev, optionId]
        );
      } else {
        setSelectedIds((prev) =>
          prev.includes(optionId) ? [] : [optionId]
        );
      }
    },
    [poll.isMultiChoice]
  );

  const handleSubmit = useCallback(() => {
    if (selectedIds.length === 0) return;
    onVote(poll.id, selectedIds);
  }, [poll.id, selectedIds, onVote]);

  return (
    <View style={styles.container}>
      {poll.options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
            ]}
            onPress={() => toggleOption(option.id)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {poll.isMultiChoice ? (
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              ) : (
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              )}
            </View>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option.text}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.submitBtn, selectedIds.length === 0 && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={selectedIds.length === 0}
      >
        <Text style={styles.submitBtnText}>Vote</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#0A84FF',
    backgroundColor: '#0A84FF20',
  },
  radioOuter: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#0A84FF',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0A84FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#0A84FF',
    backgroundColor: '#0A84FF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  optionTextSelected: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#0A84FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
