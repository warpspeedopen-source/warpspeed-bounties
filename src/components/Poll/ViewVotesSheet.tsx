import React from 'react';
import { View, Text, ScrollView, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Poll } from '../../types/poll';

interface ViewVotesSheetProps {
  visible: boolean;
  onClose: () => void;
  poll: Poll;
}

const mockUsers: Record<string, { name: string; avatar: string }> = {
  user1: { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
  user2: { name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
  user3: { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' }
};

export const ViewVotesSheet: React.FC<ViewVotesSheetProps> = ({ visible, onClose, poll }) => {
  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Poll Results</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.question}>{poll.question}</Text>

          <ScrollView style={styles.optionsContainer}>
            {poll.options.map(option => (n              <View key={option.id} style={styles.optionSection}>
                <Text style={styles.optionTitle}>{option.text} ({option.votedUsers.length})</Text>
                {option.votedUsers.length === 0 ? (
                  <Text style={styles.noVotes}>No votes yet</Text>
                ) : (
                  option.votedUsers.map(userId => {
                    const user = mockUsers[userId] || { name: userId, avatar: 'https://i.pravatar.cc/150?u=default' };
                    return (
                      <View key={userId} style={styles.voterRow}>
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        <Text style={styles.voterName}>{user.name}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { fontSize: 28, color: '#888', paddingHorizontal: 5 },
  question: { fontSize: 16, fontWeight: '600', marginBottom: 20, color: '#333' },
  optionsContainer: { maxHeight: 400 },
  optionSection: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  optionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#25D366' },
  noVotes: { color: '#888', fontStyle: 'italic' },
  voterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#ddd' },
  voterName: { fontSize: 14, color: '#333' }
});
