import React from 'react';
import { View } from 'react-native';
import { ClassicInboxScreen } from '../../screens/ClassicInboxScreen';
import { InboxHeader } from './InboxHeader';
import { EmailItem } from './EmailItem';

export default {
  title: 'Classic Inbox',
  component: ClassicInboxScreen,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
        <Story />
      </View>
    ),
  ],
};

export const FullScreen = () => <ClassicInboxScreen />;

export const HeaderOnly = () => <InboxHeader activeCategory="Primary" onCategoryChange={() => {}} />;

export const UnreadEmail = () => (
  <EmailItem email={{ id: '1', sender: 'Alice', subject: 'Project Update', preview: 'Here is the latest update...', isRead: false, date: '10:30 AM' }} />
);

export const ReadEmail = () => (
  <EmailItem email={{ id: '2', sender: 'Bob', subject: 'Meeting Tomorrow', preview: 'Let\'s sync up at 10 AM...', isRead: true, date: 'Yesterday' }} />
);