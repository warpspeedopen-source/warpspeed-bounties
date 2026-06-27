import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Switch,
} from 'react-native';
import { PollCreationData, VoteType, MAX_POLL_OPTIONS, MAX_QUESTION_LENGTH } from '../types';

interface PollCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pollData: PollCreationData) => void;
}

/**
 * Poll creation form accessible from the group chat input action/arrow menu.
 */
export const PollCreationModal: React.FC<PollCreationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [voteType, setVoteType] = useState<VoteType>('single');

  const handleAddOption = useCallback(() => {
    if (options.length < MAX_POLL_OPTIONS) {
      setOptions((prev) => [...prev, '']);
    }
  }, [options.length]);

  const handleRemoveOption = useCallback((index: number) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  }, [options.length]);

  const handleOptionChange = useCallback((index: number, text: string) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!question.trim()) return;
    const nonEmptyOptions = options.filter((opt) => opt.trim().length > 0);
    if (nonEmptyOptions.length < 2) return;

    onSubmit({
      question: question.trim(),
      options: nonEmptyOptions,
      voteType,
    });

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setVoteType('single');
    onClose();
  }, [question, options, voteType, onSubmit, onClose]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Poll</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text
              style={[
                styles.sendText,
                (!question.trim() || options.filter((o) => o.trim()).length < 2) &&
                  styles.sendTextDisabled,
              ]}
            >
              Send
            </Text>
          </TouchableOpacity>
        </View>

        {/* Question Input */}
        <View style={styles.questionContainer}>
          <TextInput
            style={styles.questionInput}
            placeholder="Ask a question..."
            placeholderTextColor="#8E8E93"
            value={question}
            onChangeText={setQuestion}
            maxLength={MAX_QUESTION_LENGTH}
            multiline
          />
          <Text style={styles.charCount}>
            {question.length}/{MAX_QUESTION_LENGTH}
          </Text>
        </View>

        {/* Options */}
        <Text style={styles.sectionLabel}>Options</Text>
        <FlatList
          data={options}
          keyExtractor={(_, index) => `option-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor="#C7C7CC"
                value={item}
                onChangeText={(text) => handleOptionChange(index, text)}
                maxLength={100}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveOption(index)}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          scrollEnabled={false}
        />

        {/* Add Option Button */}
        {options.length < MAX_POLL_OPTIONS && (
          <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption}>
            <Text style={styles.addOptionText}>+ Add Option</Text>
          </TouchableOpacity>
        )}

        {/* Vote Type Toggle */}
        <View style={styles.voteTypeContainer}>
          <Text style={styles.sectionLabel}>Allow multiple choices</Text>
          <Switch
            value={voteType === 'multiple'}
            onValueChange={(val) => setVoteType(val ? 'multiple' : 'single')}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  sendTextDisabled: {
    color: '#C7C7CC',
  },
  questionContainer: {
    marginTop: 16,
  },
  questionInput: {
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 8,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  removeIcon: {
    fontSize: 16,
    color: '#FF3B30',
  },
  addOptionButton: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginTop: 4,
  },
  addOptionText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  voteTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default PollCreationModal;
