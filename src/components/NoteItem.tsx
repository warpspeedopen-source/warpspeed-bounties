import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Note } from '../types';
import { useNoteLock } from '../hooks/useNoteLock';
import { LockScreen } from './LockScreen';
import { useTailwind } from 'nativewind';
import { Feather } from '@expo/vector-icons';

interface Props {
  note: Note;
}

/**
 * Renders a single note in the list. If the note is locked,
 * its content is obscured and a lock icon is shown.
 */
export const NoteItem: React.FC<Props> = ({ note }) => {
  const { locked, lock, unlock, remove, setPin, verifyPin } = useNoteLock(note);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const tw = useTailwind();

  const handlePress = async () => {
    if (locked) {
      // try biometric first; if it fails, show PIN modal
      const success = await unlock();
      if (!success) {
        setShowLockScreen(true);
      }
    } else {
      // open note editor – placeholder
      Alert.alert('Open Note', note.title);
    }
  };

  const handleLongPress = () => {
    // simple actions for demo: lock/unlock via menu
    if (locked) {
      Alert.alert('Note Locked', 'Long press to remove lock', [
        {
          text: 'Remove Lock',
          onPress: async () => {
            await remove();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Lock Note', 'Do you want to lock this note?', [
        {
          text: 'Lock',
          onPress: async () => {
            await lock();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={tw`p-4 border-b border-gray-200 bg-white`}
    >
      <View style={tw`flex-row justify-between items-center`}>
        <Text style={tw`text-lg font-medium`}>{note.title}</Text>
        {locked && <Feather name="lock" size={20} color="gray" />}
      </View>
      <Text style={tw`text-gray-600 mt-1`}>
        {locked ? '••••••••' : note.content}
      </Text>

      <LockScreen
        visible={showLockScreen}
        onClose={() => setShowLockScreen(false)}
      />
    </TouchableOpacity>
  );
};
