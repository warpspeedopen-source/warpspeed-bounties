import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface Email {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  isRead: boolean;
  date: string;
}

interface EmailItemProps {
  email: Email;
}

export const EmailItem = ({ email }: EmailItemProps) => {
  return (
    <TouchableOpacity style={[styles.container, email.isRead ? styles.read : styles.unread]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{email.sender[0]}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.sender, !email.isRead && styles.bold]}>{email.sender}</Text>
          <Text style={styles.date}>{email.date}</Text>
        </View>
        <Text style={[styles.subject, !email.isRead && styles.bold]} numberOfLines={1}>{email.subject}</Text>
        <Text style={styles.preview} numberOfLines={1}>{email.preview}</Text>
      </View>
      {!email.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  read: { backgroundColor: '#FAFAFA' },
  unread: { backgroundColor: '#FFF' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#555' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sender: { fontSize: 16, color: '#333' },
  date: { fontSize: 12, color: '#888' },
  subject: { fontSize: 14, color: '#333', marginBottom: 2 },
  preview: { fontSize: 13, color: '#666' },
  bold: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A73E8', marginLeft: 8 },
});