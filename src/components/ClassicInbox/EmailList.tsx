import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { EmailItem, Email } from './EmailItem';

const MOCK_EMAILS: Email[] = [
  { id: '1', sender: 'Alice', subject: 'Project Update', preview: 'Here is the latest update on the warpSpeed design system components...', isRead: false, date: '10:30 AM' },
  { id: '2', sender: 'Bob', subject: 'Meeting Tomorrow', preview: 'Let\'s sync up at 10 AM to discuss the classic inbox UI implementation.', isRead: true, date: 'Yesterday' },
  { id: '3', sender: 'Newsletter', subject: 'Weekly Digest', preview: 'Top stories this week in open source development and design systems.', isRead: false, date: 'Mon' },
  { id: '4', sender: 'GitHub', subject: 'New Bounty Assigned', preview: 'You have been assigned a new bounty for the Classic Inbox View Page.', isRead: false, date: 'Sun' },
];

interface EmailListProps {
  scrollY: Animated.Value;
  category: string;
}

export const EmailList = ({ scrollY }: EmailListProps) => {
  return (
    <Animated.FlatList
      data={MOCK_EMAILS}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EmailItem email={item} />}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: { paddingTop: 180, paddingBottom: 20 },
});