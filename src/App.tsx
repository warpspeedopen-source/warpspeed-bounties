import React from 'react';
import { SafeAreaView } from 'react-native';
import { LockProvider } from './context/LockProvider';
import { NotesList } from './components/NotesList';
import { useTailwind } from 'nativewind';

// Mock data – replace with real store in the actual app
const MOCK_NOTES = [
  { id: '1', title: 'Shopping List', content: 'Milk, Eggs, Bread' },
  { id: '2', title: 'Work Ideas', content: 'Build a new feature' },
  { id: '3', title: 'Secret', content: 'My private note', locked: true },
];

export default function App() {
  const tw = useTailwind();

  return (
    <LockProvider>
      <SafeAreaView style={tw`flex-1 bg-gray-100`}>
        <NotesList notes={MOCK_NOTES} />
      </SafeAreaView>
    </LockProvider>
  );
}
