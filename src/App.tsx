import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import ClassicInbox from './components/ClassicInbox';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ClassicInbox />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
