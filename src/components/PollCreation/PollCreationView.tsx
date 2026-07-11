import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { PollOption, PollView } from '../PollView/PollView';

interface PollCreationViewProps {
  groupId: string;
  userId: string;
  onPollCreated: (pollData: any) => void;
  onCancel: () => void;
}

export const PollCreationView: React.FC<PollCreationViewProps> = ({
  groupId,
  userId,
  onPollCreated,
  onCancel
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ id: 1, text: '' }, { id: 2, text: '' }]);
  const [isMultiChoice, setIsMultiChoice] = useState(false);
  const maxOptions = 12;
  const maxQuestionLength = 255;

  const addOption = () => {
    if (options.length >= maxOptions) {
      Alert.alert('Maximum options reached', `You can add up to ${maxOptions} options only`);
      return;
    }
    setOptions([...options, { id: options.length + 1, text: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Minimum 2 options required');
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    if (!question.trim()) {
      Alert.alert('Please enter a question');
      return;
    }
    
    const pollOptions = options.map(opt => opt.text).filter(text => text.trim() !== '');
    if (pollOptions.length < 2) {
      Alert.alert('At least 2 options are required');
      return;
    }
    
    const pollData = {
      question,
      options: pollOptions,
      groupId,
      userId,
      isMultiChoice,
      createdAt: new Date().toISOString()
    };
    
    onPollCreated(pollData);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.questionInput}
        placeholder="Ask a question..."
        value={question}
        onChangeText={setQuestion}
        maxLength={maxQuestionLength}
      />
      <View style={styles.optionsContainer}>
        <FlatList
          data={options}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.optionItem}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${index + 1}`}
                value={item.text}
                onChangeText={(text) => {
                  const newOptions = [...options];
                  newOptions[index].text = text;
                  setOptions(newOptions);
                }}
              />
              {index >= 2 && (
                <TouchableOpacity
                  style={styles.removeOptionButton}
                  onPress={() => removeOption(index)}
                >
                  <Text>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePoll}>
          <Text style={styles.buttonText}>Create Poll</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  optionsContainer: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
  },
  removeOptionButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#888',
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PollCreationView;