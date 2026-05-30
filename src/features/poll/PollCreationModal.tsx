import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { CreatePollInput } from './types';

const QUESTION_MAX_LENGTH = 255;
const OPTIONS_MIN = 2;
const OPTIONS_MAX = 12;
const HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };

interface PollCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePollInput) => void;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleChoice, setAllowMultipleChoice] = useState(false);
  const optionRefs = useRef<Array<TextInput | null>>([]);

  const reset = useCallback(() => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultipleChoice(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(() => {
    const trimmedQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (!trimmedQuestion) {
      Alert.alert('Missing Question', 'Please enter a poll question.');
      return;
    }
    if (validOptions.length < OPTIONS_MIN) {
      Alert.alert('Not Enough Options', `Please provide at least ${OPTIONS_MIN} options.`);
      return;
    }

    onSubmit({ question: trimmedQuestion, optionTexts: validOptions, allowMultipleChoice });
    reset();
  }, [question, options, allowMultipleChoice, onSubmit, reset]);

  const addOption = useCallback(() => {
    if (options.length < OPTIONS_MAX) {
      setOptions((prev) => [...prev, '']);
    }
  }, [options.length]);

  const removeOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateOption = useCallback((index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }, []);

  const isSubmitDisabled =
    !question.trim() || options.filter((o) => o.trim()).length < OPTIONS_MIN;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerSideButton} hitSlop={HITSLOP}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Poll</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.headerSideButton, isSubmitDisabled && styles.disabled]}
            disabled={isSubmitDisabled}
            hitSlop={HITSLOP}
          >
            <Text style={[styles.createText, isSubmitDisabled && styles.createTextDisabled]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <Text style={styles.sectionLabel}>QUESTION</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask something..."
              placeholderTextColor="#AEAEB2"
              value={question}
              onChangeText={setQuestion}
              maxLength={QUESTION_MAX_LENGTH}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <Text
              style={[
                styles.charCount,
                question.length > QUESTION_MAX_LENGTH * 0.9 && styles.charCountWarning,
              ]}
            >
              {question.length}/{QUESTION_MAX_LENGTH}
            </Text>
          </View>

          {/* Options */}
          <Text style={styles.sectionLabel}>OPTIONS</Text>
          <View style={styles.card}>
            {options.map((option, index) => (
              <View
                key={index}
                style={[
                  styles.optionRow,
                  index < options.length - 1 && styles.optionRowBorder,
                ]}
              >
                <View style={styles.optionBullet}>
                  <Text style={styles.optionBulletText}>{index + 1}</Text>
                </View>
                <TextInput
                  ref={(r) => {
                    optionRefs.current[index] = r;
                  }}
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#AEAEB2"
                  value={option}
                  onChangeText={(val) => updateOption(index, val)}
                  returnKeyType={index < options.length - 1 ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    optionRefs.current[index + 1]?.focus();
                  }}
                  blurOnSubmit={index === options.length - 1}
                />
                {options.length > OPTIONS_MIN && (
                  <TouchableOpacity
                    onPress={() => removeOption(index)}
                    style={styles.removeButton}
                    hitSlop={HITSLOP}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {options.length < OPTIONS_MAX && (
            <TouchableOpacity onPress={addOption} style={styles.addOptionRow} activeOpacity={0.7}>
              <View style={styles.addOptionIcon}>
                <Text style={styles.addOptionIconText}>+</Text>
              </View>
              <Text style={styles.addOptionLabel}>Add Option</Text>
              <Text style={styles.optionCountHint}>
                {options.length}/{OPTIONS_MAX}
              </Text>
            </TouchableOpacity>
          )}

          {/* Settings */}
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Multiple Choice</Text>
                <Text style={styles.settingDescription}>
                  Allow voters to select more than one option
                </Text>
              </View>
              <Switch
                value={allowMultipleChoice}
                onValueChange={setAllowMultipleChoice}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerSideButton: {
    minWidth: 64,
  },
  disabled: {
    opacity: 0.4,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  createText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  createTextDisabled: {
    color: '#C7C7CC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C6C70',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionInput: {
    fontSize: 16,
    color: '#000000',
    padding: 14,
    minHeight: 88,
    maxHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: '#AEAEB2',
    textAlign: 'right',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  charCountWarning: {
    color: '#FF9500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  optionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  optionBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  optionBulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C6C70',
  },
  optionInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: 10,
  },
  removeButton: {
    padding: 6,
    marginLeft: 4,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#AEAEB2',
  },
  addOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  addOptionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addOptionIconText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '400',
    lineHeight: 22,
  },
  addOptionLabel: {
    flex: 1,
    fontSize: 15,
    color: '#007AFF',
  },
  optionCountHint: {
    fontSize: 13,
    color: '#AEAEB2',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    color: '#000000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});
