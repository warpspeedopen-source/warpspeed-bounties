import React, { useState } from 'react';
import { View, Text, TextInput, Button, Switch, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Poll } from './types';

interface PollCreationProps {
  onSubmit: (poll: Omit<Poll, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  creatorId: string;
  totalGroupParticipants: number;
}

export const PollCreation: React.FC<PollCreationProps> = ({ onSubmit, onCancel, creatorId, totalGroupParticipants }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);

  const handleAddOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) return;

    onSubmit({
      question: question.trim(),
      options: validOptions.map((opt, idx) => ({ id: `opt-${idx}`, text: opt, voterIds: [] })),
      allowMultipleChoices,
      creatorId,
      totalGroupParticipants,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Poll</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Ask a question"
        value={question}
        onChangeText={setQuestion}
        maxLength={255}
        testID="poll-question-input"
      />
      
      {options.map((option, index) => (
        <View key={index} style={styles.optionContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Option ${index + 1}`}
            value={option}
            onChangeText={(text) => handleOptionChange(text, index)}
            testID={`poll-option-input-${index}`}
          />
          {options.length > 2 && (
            <TouchableOpacity onPress={() => handleRemoveOption(index)} testID={`remove-option-${index}`}>
              <Text style={styles.removeText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {options.length < 12 && (
        <Button title="Add Option" onPress={handleAddOption} testID="add-option-button" />
      )}

      <View style={styles.switchContainer}>
        <Text>Allow multiple answers</Text>
        <Switch
          value={allowMultipleChoices}
          onValueChange={setAllowMultipleChoices}
          testID="multiple-choices-switch"
        />
      </View>

      <View style={styles.actions}>
        <Button title="Cancel" onPress={onCancel} testID="cancel-button" />
        <Button 
          title="Send" 
          onPress={handleSubmit} 
          disabled={!question.trim() || options.filter(o => o.trim()).length < 2} 
          testID="submit-poll-button"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, flex: 1, borderRadius: 4 },
  optionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  removeText: { color: 'red', padding: 8, marginLeft: 8, fontWeight: 'bold' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }
});
