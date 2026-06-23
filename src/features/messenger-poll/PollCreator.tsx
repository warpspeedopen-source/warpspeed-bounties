import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

interface PollOption { id: string; text: string; votes: number; }

export function PollCreator() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }]);
  const [voted, setVoted] = useState<string | null>(null);

  const addOption = useCallback(() => {
    setOptions(prev => [...prev, { id: Date.now().toString(), text: '', votes: 0 }]);
  }, []);

  const vote = useCallback((id: string) => {
    if (voted) return;
    setVoted(id);
    setOptions(prev => prev.map(o => o.id === id ? { ...o, votes: o.votes + 1 } : o));
  }, [voted]);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <View style={styles.container}>
      <TextInput style={styles.question} placeholder="Ask a question..." value={question} onChangeText={setQuestion} />
      {options.map(opt => (
        <TouchableOpacity key={opt.id} style={[styles.option, voted === opt.id && styles.voted]} onPress={() => vote(opt.id)}>
          <Text style={styles.optionText}>{opt.text || 'Option'}</Text>
          {voted && <Text style={styles.votes}>{totalVotes > 0 ? Math.round(opt.votes/totalVotes*100) : 0}%</Text>}
        </TouchableOpacity>
      ))}
      {!voted && <TouchableOpacity onPress={addOption}><Text style={styles.addBtn}>+ Add Option</Text></TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  question: { fontSize: 18, fontWeight: '600', marginBottom: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  option: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 },
  voted: { backgroundColor: '#e3f2fd' },
  optionText: { fontSize: 15 },
  votes: { fontSize: 14, fontWeight: '600', color: '#1976D2' },
  addBtn: { color: '#1976D2', textAlign: 'center', padding: 12, fontSize: 15 },
});
