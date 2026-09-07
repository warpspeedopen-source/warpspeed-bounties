import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';

interface PollCreationSheetProps {
  onClose: () => void;
  onSubmit: (pollData: { question: string; options: string[]; allowMultipleChoices: boolean }) => void;
}

export const PollCreationSheet: React.FC<PollCreationSheetProps> = ({ onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);

  const handleAddOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    } else {
      Alert.alert('Maximum options reached', 'You can only add up to 12 options.');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      Alert.alert('Minimum options required', 'A poll must have at least 2 options.');
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      Alert.alert('Error', 'Please enter a question.');
      return;
    }
    const validOptions = options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please provide at least 2 valid options.');
      return;
    }

    onSubmit({
      question: trimmedQuestion,
      options: validOptions,
      allowMultipleChoices,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Poll</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.questionInput}
          placeholder="Ask a question..."
          value={question}
          onChangeText={setQuestion}
          maxLength={255}
          multiline
        />
        <Text style={styles.charCount}>{question.length}/255</Text>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Options</Text>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChangeText={(text) => handleOptionChange(text, index)}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  onPress={() => handleRemoveOption(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {options.length < 12 && (
            <TouchableOpacity onPress={handleAddOption} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Option</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingsContainer}>
          <Text style={styles.settingLabel}>Allow multiple answers</Text>
          <Switch
            value={allowMultipleChoices}
            onValueChange={setAllowMultipleChoices}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  optionsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
  },
  removeButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
