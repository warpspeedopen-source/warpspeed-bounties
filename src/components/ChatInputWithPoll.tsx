import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { PollCreation } from './PollCreation';

interface ChatInputWithPollProps {
  onSendMessage: (message: string) => void;
  onSendPoll: (poll: {
    question: string;
    options: string[];
    multipleChoice: boolean;
  }) => void;
}

export const ChatInputWithPoll: React.FC<ChatInputWithPollProps> = ({
  onSendMessage,
  onSendPoll,
}) => {
  const [text, setText] = useState('');
  const [pollCreationVisible, setPollCreationVisible] = useState(false);

  const sendMessage = () => {
    if (text.trim().length === 0) return;
    onSendMessage(text.trim());
    setText('');
  };

  const openPollCreation = () => {
    setPollCreationVisible(true);
  };

  const closePollCreation = () => {
    setPollCreationVisible(false);
  };

  const handleCreatePoll = (poll: {
    question: string;
    options: string[];
    multipleChoice: boolean;
  }) => {
    onSendPoll(poll);
    setPollCreationVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={styles.pollButton}
          onPress={openPollCreation}
          accessibilityLabel="Create poll"
        >
          <Text style={styles.pollButtonText}>📊</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={pollCreationVisible}
        animationType="slide"
        onRequestClose={closePollCreation}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PollCreation onCreate={handleCreatePoll} onCancel={closePollCreation} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  pollButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  pollButtonText: {
    fontSize: 20,
    color: 'white',
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2ecc71',
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
});
