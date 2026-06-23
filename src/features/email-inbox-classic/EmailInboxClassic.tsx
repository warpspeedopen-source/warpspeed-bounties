import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, TextInput } from 'react-native';

interface Email { id: string; from: string; subject: string; preview: string; date: string; read: boolean; }

export function EmailInboxClassic() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = emails.filter(e => 
    e.subject.toLowerCase().includes(search.toLowerCase()) || 
    e.from.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = useCallback(({ item }: { item: Email }) => (
    <TouchableOpacity 
      style={[styles.row, !item.read && styles.unread]}
      onPress={() => setSelected(s => { const n = new Set(s); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; })}
    >
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.from[0].toUpperCase()}</Text></View>
      <View style={styles.content}>
        <Text style={[styles.from, !item.read && styles.bold]}>{item.from}</Text>
        <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.preview} numberOfLines={1}>{item.preview}</Text>
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={setSearch} />
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={i => i.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  unread: { backgroundColor: '#f0f7ff' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4A90D9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1 },
  from: { fontSize: 14, color: '#333' },
  bold: { fontWeight: 'bold' },
  subject: { fontSize: 13, color: '#555', marginTop: 2 },
  preview: { fontSize: 12, color: '#999', marginTop: 2 },
  date: { fontSize: 11, color: '#aaa', marginLeft: 8 },
});
