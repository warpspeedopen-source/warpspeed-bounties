/**
 * PollCreationModal Component
 * Full-screen modal for creating a new poll with question and options
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { PollCreateInput, PollVoteMode } from '../types';
import {
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  POLL_QUESTION_MAX_LENGTH,
  POLL_OPTION_MAX_LENGTH,
} from '../constants';

interface PollCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: PollCreateInput) => void;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [voteMode, setVoteMode] = useState<PollVoteMode>('single');
  const optionRefs = useRef<(TextInput | null)[]>([]);

  const resetForm = useCallback(() => {
    setQuestion('');
    setOptions(['', '']);
    setVoteMode('single');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleAddOption = useCallback(() => {
    if (options.length < MAX_POLL_OPTIONS) {
      setOptions((prev) => [...prev, '']);
    }
  }, [options.length]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      if (options.length > MIN_POLL_OPTIONS) {
        setOptions((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [options.length]
  );

  const handleOptionChange = useCallback((text: string, index: number) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedQuestion = question.trim();
    const validOptions = options.filter((o) => o.trim().length > 0);

    if (!trimmedQuestion) {
      Alert.alert('Missing Question', 'Please enter a poll question.');
      return;
    }
    if (trimmedQuestion.length > POLL_QUESTION_MAX_LENGTH) {
      Alert.alert('Question Too Long', `Maximum ${POLL_QUESTION_MAX_LENGTH} characters allowed.`);
      return;
    }
    if (validOptions.length < MIN_POLL_OPTIONS) {
      Alert.alert('Not Enough Options', `Please add at least ${MIN_POLL_OPTIONS} options.`);
      return;
    }

    onSubmit({
      question: trimmedQuestion,
      options,
      voteMode,
    });

    resetForm();
  }, [question, options, voteMode, onSubmit, resetForm]);

  const canAddOption = options.length < MAX_POLL_OPTIONS;
  const canRemoveOption = options.length > MIN_POLL_OPTIONS;
  const validOptionCount = options.filter((o) => o.trim().length > 0).length;
  const canSubmit = question.trim().length > 0 && validOptionCount >= MIN_POLL_OPTIONS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Poll</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.headerButton, !canSubmit && styles.headerButtonDisabled]}
          >
            <Text style={[styles.sendText, !canSubmit && styles.sendTextDisabled]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Question</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask a question..."
              placeholderTextColor="#AAAAAA"
              value={question}
              onChangeText={setQuestion}
              maxLength={POLL_QUESTION_MAX_LENGTH}
              multiline
              autoFocus
            />
            <Text style={styles.charCount}>
              {question.length}/{POLL_QUESTION_MAX_LENGTH}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Options ({options.length}/{MAX_POLL_OPTIONS})
            </Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={styles.optionNumber}>
                  <Text style={styles.optionNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  ref={(ref) => { optionRefs.current[index] = ref; }}
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#AAAAAA"
                  value={option}
                  onChangeText={(text) => handleOptionChange(text, index)}
                  maxLength={POLL_OPTION_MAX_LENGTH}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (index < options.length - 1) {
                      optionRefs.current[index + 1]?.focus();
                    } else if (canAddOption) {
                      handleAddOption();
                    }
                  }}
                />
                {canRemoveOption && (
                  <TouchableOpacity
                    onPress={() => handleRemoveOption(index)}
                    style={styles.removeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {canAddOption && (
              <TouchableOpacity onPress={handleAddOption} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Option</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Vote Mode Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Allow multiple answers</Text>
                <Text style={styles.toggleDescription}>
                  Voters can select more than one option
                </Text>
              </View>
              <Switch
                value={voteMode === 'multiple'}
                onValueChange={(val) => setVoteMode(val ? 'multiple' : 'single')}
                trackColor={{ false: '#E0E0E0', true: '#A8D0FF' }}
                thumbColor={voteMode === 'multiple' ? '#4285F4' : '#F4F3F4'}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerButtonDisabled: {
    opacity: 0.4,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sendText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: '#AAAAAA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  questionInput: {
    fontSize: 18,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: 12,
    minHeight: 50,
  },
  charCount: {
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'right',
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4285F4',
  },
  optionInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: 10,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 15,
    color: '#4285F4',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
});
