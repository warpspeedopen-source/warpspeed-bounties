import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react-native';
import { ClassicInbox } from './ClassicInbox';
import { EmailCategory, EmailItem } from './types';

export default {
  title: 'Inbox/ClassicInbox',
  component: ClassicInbox,
} as ComponentMeta<typeof ClassicInbox>;

const Template: ComponentStory<typeof ClassicInbox> = (args) => <ClassicInbox {...args} />;

const mockEmails: EmailItem[] = [
  {
    id: '1',
    sender: 'Sarah Chen',
    subject: 'Q4 Marketing Strategy - Review Needed',
    preview: 'Hi team, I have attached the latest draft of our Q4 marketing strategy. Please review and provide feedback by Friday...',
    timestamp: '10:30 AM',
    isRead: false,
    isStarred: true,
    category: EmailCategory.PRIMARY,
    avatar: 'SC',
  },
  {
    id: '2',
    sender: 'GitHub',
    subject: 'Security alert for your repository',
    preview: 'We found a potential security vulnerability in one of your dependencies...',
    timestamp: '9:15 AM',
    isRead: false,
    isStarred: false,
    category: EmailCategory.PROMOTIONS,
    avatar: 'GH',
  },
  {
    id: '3',
    sender: 'Alex Rodriguez',
    subject: 'Lunch this Friday?',
    preview: 'Hey! Are you free for lunch this Friday? I found a great new place downtown...',
    timestamp: 'Yesterday',
    isRead: true,
    isStarred: false,
    category: EmailCategory.PRIMARY,
    avatar: 'AR',
  },
  {
    id: '4',
    sender: 'Amazon',
    subject: 'Your order has shipped!',
    preview: 'Your recent order #12345 has been shipped and will arrive on Tuesday...',
    timestamp: 'Yesterday',
    isRead: true,
    isStarred: false,
    category: EmailCategory.PROMOTIONS,
    avatar: 'AZ',
  },
  {
    id: '5',
    sender: 'Slack',
    subject: 'New message in #engineering',
    preview: 'You have a new mention in the engineering channel from Mike Johnson...',
    timestamp: 'Mon',
    isRead: true,
    isStarred: false,
    category: EmailCategory.UPDATES,
    avatar: 'SL',
  },
  {
    id: '6',
    sender: 'LinkedIn',
    subject: '5 people viewed your profile',
    preview: 'See who viewed your profile this week and expand your network...',
    timestamp: 'Mon',
    isRead: true,
    isStarred: false,
    category: EmailCategory.PROMOTIONS,
    avatar: 'LI',
  },
];

export const Default = Template.bind({});
Default.args = {
  emails: mockEmails,
  activeCategory: EmailCategory.PRIMARY,
  accountName: 'john.doe@company.com',
};

export const EmptyState = Template.bind({});
EmptyState.args = {
  emails: [],
  activeCategory: EmailCategory.PRIMARY,
  accountName: 'john.doe@company.com',
};

export const AllRead = Template.bind({});
AllRead.args = {
  emails: mockEmails.map(e => ({ ...e, isRead: true })),
  activeCategory: EmailCategory.PRIMARY,
  accountName: 'john.doe@company.com',
};