import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, Switch } from 'react-native';

interface PollCreationSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[], allowMultiple: boolean) => void;
}

export const PollCreationSheet: React.FC<PollCreationSheetProps> = ({ visible, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const addOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreate = () => {
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll(question, validOptions, allowMultiple);
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Create Poll</Text>
          <TextInput
            style={styles.questionInput}
            placeholder='Ask a question...'
            maxLength={255}
            value={question}
            onChangeText={setQuestion}
          />
          <Text style={styles.charCount}>{question.length}/255</Text>
          
          <ScrollView style={styles.optionsContainer}>
            {options.map((opt, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChangeText={(text) => updateOption(index, text)}
                />
                {options.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(index)}>
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {options.length < 12 && (
              <TouchableOpacity onPress={addOption} style={styles.addButton}>
                <Text style={styles.addText}>+ Add option</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.switchRow}>
            <Text>Allow multiple choices</Text>
            <Switch value={allowMultiple} onValueChange={setAllowMultiple} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
              <Text style={styles.createText}>Create Poll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  questionInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 5 },
  charCount: { textAlign: 'right', color: '#888', fontSize: 12, marginBottom: 15 },
  optionsContainer: { maxHeight: 200, marginBottom: 15 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  optionInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginRight: 10 },
  removeText: { fontSize: 24, color: '#ff4444', paddingHorizontal: 5 },
  addButton: { padding: 10, alignItems: 'center' },
  addText: { color: '#007AFF', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { padding: 10 },
  createButton: { backgroundColor: '#25D366', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  createText: { color: '#fff', fontWeight: 'bold' }
});
