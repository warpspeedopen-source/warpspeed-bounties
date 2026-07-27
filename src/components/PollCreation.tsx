import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

interface PollOption {
  id: number;
  text: string;
}

interface PollCreationProps {
  onCreate: (poll: {
    question: string;
    options: string[];
    multipleChoice: boolean;
  }) => void;
  onCancel: () => void;
}

const MAX_OPTIONS = 12;
const MAX_QUESTION_LENGTH = 255;

export const PollCreation: React.FC<PollCreationProps> = ({ onCreate, onCancel }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: '' },
    { id: 2, text: '' },
  ]);
  const [multipleChoice, setMultipleChoice] = useState(false);

  const updateOptionText = (id: number, text: string) => {
    setOptions((opts) =>
      opts.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) {
      Alert.alert(`Maximum of ${MAX_OPTIONS} options allowed.`);
      return;
    }
    const newId = options.length > 0 ? options[options.length - 1].id + 1 : 1;
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: number) => {
    if (options.length <= 2) {
      Alert.alert('At least two options are required.');
      return;
    }
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleCreate = () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      Alert.alert('Please enter a poll question.');
      return;
    }
    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      Alert.alert(`Question cannot exceed ${MAX_QUESTION_LENGTH} characters.`);
      return;
    }
    const filledOptions = options
      .map((opt) => opt.text.trim())
      .filter((text) => text.length > 0);
    if (filledOptions.length < 2) {
      Alert.alert('Please enter at least two poll options.');
      return;
    }
    onCreate({
      question: trimmedQuestion,
      options: filledOptions,
      multipleChoice,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Poll</Text>
      <TextInput
        style={styles.questionInput}
        placeholder="Poll question"
        value={question}
        onChangeText={setQuestion}
        maxLength={MAX_QUESTION_LENGTH}
        multiline
      />
      <ScrollView style={styles.optionsContainer}>
        {options.map((option, index) => (
          <View key={option.id} style={styles.optionRow}>
            <TextInput
              style={styles.optionInput}
              placeholder={`Option ${index + 1}`}
              value={option.text}
              onChangeText={(text) => updateOptionText(option.id, text)}
              maxLength={100}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeOption(option.id)}
              accessibilityLabel={`Remove option ${index + 1}`}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addOption}>
          <Text style={styles.addButtonText}>+ Add Option</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.choiceTypeRow}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setMultipleChoice(!multipleChoice)}
          accessibilityLabel="Toggle multiple choice"
        >
          <View style={[styles.checkboxBox, multipleChoice && styles.checkedBox]}>
            {multipleChoice && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Allow multiple choices</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create Poll</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  questionInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    minHeight: 60,
    marginBottom: 12,
  },
  optionsContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  choiceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 3,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#3498db',
  },
  checkmark: {
    color: 'white',
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#3498db',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
