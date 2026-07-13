import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  PollCreationData,
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
} from '../types';

interface PollCreationSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: PollCreationData) => void;
}

export const PollCreationSheet: React.FC<PollCreationSheetProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isMultiChoice, setIsMultiChoice] = useState(false);

  const addOption = useCallback(() => {
    if (options.length < MAX_OPTIONS) {
      setOptions((prev) => [...prev, '']);
    }
  }, [options.length]);

  const removeOption = useCallback((index: number) => {
    setOptions((prev) => {
      if (prev.length <= MIN_OPTIONS) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateOption = useCallback((index: number, text: string) => {
    if (text.length > OPTION_MAX_LENGTH) return;
    setOptions((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  }, []);

  const canSubmit =
    question.trim().length > 0 &&
    options.every((o) => o.trim().length > 0) &&
    options.length >= MIN_OPTIONS;

  const handleCreate = useCallback(() => {
    if (!canSubmit) return;
    onCreate({
      question: question.trim(),
      options: options.map((o) => o.trim()).filter(Boolean),
      isMultiChoice,
    });
    setQuestion('');
    setOptions(['', '']);
    setIsMultiChoice(false);
    onClose();
  }, [canSubmit, question, options, isMultiChoice, onCreate, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Create Poll</Text>

            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask something..."
              placeholderTextColor="#8E8E93"
              value={question}
              onChangeText={setQuestion}
              maxLength={QUESTION_MAX_LENGTH}
              multiline
            />

            <Text style={styles.label}>
              Options ({options.length}/{MAX_OPTIONS})
            </Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <Text style={styles.optionIndex}>{index + 1}.</Text>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#8E8E93"
                  value={option}
                  onChangeText={(t) => updateOption(index, t)}
                  maxLength={OPTION_MAX_LENGTH}
                />
                {options.length > MIN_OPTIONS && (
                  <TouchableOpacity
                    onPress={() => removeOption(index)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < MAX_OPTIONS && (
              <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow multiple choices</Text>
              <Switch
                value={isMultiChoice}
                onValueChange={setIsMultiChoice}
                trackColor={{ false: '#3A3A3C', true: '#0A84FF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, !canSubmit && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!canSubmit}
              >
                <Text style={styles.createBtnText}>Create Poll</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  container: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 12,
  },
  questionInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIndex: {
    color: '#8E8E93',
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  removeBtn: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '700',
  },
  addOptionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 10,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addOptionText: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
