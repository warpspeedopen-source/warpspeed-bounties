import React from 'react';
import { FlatList, View } from 'react-native';
import { Note } from '../types';
import { NoteItem } from './NoteItem';
import { useTailwind } from 'nativewind';

interface Props {
  notes: Note[];
}

/**
 * Simple list wrapper used by the existing Notes screen.
 */
export const NotesList: React.FC<Props> = ({ notes }) => {
  const tw = useTailwind();

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <NoteItem note={item} />}
        contentContainerStyle={tw`pb-4`}
      />
    </View>
  );
};
