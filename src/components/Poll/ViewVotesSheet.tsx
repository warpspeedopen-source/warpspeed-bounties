import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Poll, User } from './types';

interface ViewVotesSheetProps {
  poll: Poll;
  users: Record<string, User>;
  onClose: () => void;
}

export const ViewVotesSheet: React.FC<ViewVotesSheetProps> = ({ poll, users, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Poll Results</Text>
        <TouchableOpacity onPress={onClose} testID="close-sheet-button">
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        {poll.options.map((option) => (
          <View key={option.id} style={styles.optionSection}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>{option.text}</Text>
              <Text style={styles.optionCount}>{option.voterIds.length} votes</Text>
            </View>
            {option.voterIds.length === 0 && (
              <Text style={styles.noVotesText}>No votes yet</Text>
            )}
            {option.voterIds.map((voterId) => {
              const user = users[voterId];
              return (
                <View key={voterId} style={styles.voterRow} testID={`voter-row-${voterId}`}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder} />
                  )}
                  <Text style={styles.voterName}>{user?.name || 'Unknown User'}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, marginTop: 'auto', maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  closeText: { fontSize: 16, color: '#007AFF' },
  optionSection: { marginTop: 16 },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionCount: { fontSize: 14, color: '#666' },
  noVotesText: { fontSize: 14, color: '#999', fontStyle: 'italic', paddingVertical: 4 },
  voterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f9f9f9' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc', marginRight: 12 },
  voterName: { fontSize: 14, color: '#333' },
});
