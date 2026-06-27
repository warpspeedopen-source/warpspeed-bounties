import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TopNavigation } from '../src/components/TopNavigation';
import { CategoryButtons } from '../src/components/CategoryButtons';
import { SearchFilterBar } from '../src/components/SearchFilterBar';
import { EmailListItem } from '../src/components/EmailListItem';
import { ClassicInboxView } from '../src/components/ClassicInboxView';
import { Email, MailLabel } from '../src/types';

// Sample emails for stories
const sampleEmails: Email[] = [
  {
    id: '1',
    from: { name: 'Alice Johnson', email: 'alice@example.com' },
    subject: 'Project Update - Q2 Review',
    preview: 'Hey, here is the latest update on the Q2 project review...',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isOpened: false,
    isStarred: true,
    hasAttachments: true,
    category: 'primary',
    labels: ['primary'],
  },
  {
    id: '2',
    from: { name: 'Bob Smith', email: 'bob@example.com' },
    subject: 'Weekly Standup Notes',
    preview: 'Meeting notes from this week's standup...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isOpened: true,
    isStarred: false,
    hasAttachments: false,
    category: 'primary',
    labels: ['primary'],
  },
  {
    id: '3',
    from: { name: 'Carol Davis', email: 'carol@example.com' },
    subject: 'Special Offer - 20% Discount',
    preview: 'Exclusive discount just for you...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isOpened: false,
    isStarred: false,
    hasAttachments: false,
    category: 'promotions',
    labels: ['promotions'],
  },
  {
    id: '4',
    from: { name: 'GitHub', email: 'noreply@github.com' },
    subject: '[warpspeed] New pull request #67',
    preview: 'A new pull request has been opened...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isOpened: true,
    isStarred: false,
    hasAttachments: false,
    category: 'updates',
    labels: ['updates'],
  },
];

// --- TopNavigation Story ---
const meta1: Meta<typeof TopNavigation> = {
  title: 'Inbox/TopNavigation',
  component: TopNavigation,
  parameters: { layout: 'fullscreen' },
};
export default meta1;
type Story1 = StoryObj<typeof TopNavigation>;
export const DefaultNav: Story1 = {
  args: {
    activeNav: 'classic',
    accountName: 'user@warpspeed.com',
    onNavChange: (id) => console.log('Nav:', id),
  },
};

// --- CategoryButtons Story ---
const meta2: Meta<typeof CategoryButtons> = {
  title: 'Inbox/CategoryButtons',
  component: CategoryButtons,
};
export const DefaultCategories: StoryObj<typeof CategoryButtons> = {
  args: {
    activeLabel: 'primary',
    counts: { primary: 12, promotions: 5, updates: 8 },
  },
};

// --- SearchFilterBar Story ---
const meta3: Meta<typeof SearchFilterBar> = {
  title: 'Inbox/SearchFilterBar',
  component: SearchFilterBar,
};
export const DefaultSearch: StoryObj<typeof SearchFilterBar> = {
  args: {
    searchQuery: '',
    onSearchChange: (q) => console.log('Search:', q),
    onFilterPress: () => console.log('Filter'),
  },
};

// --- EmailListItem Story ---
const meta4: Meta<typeof EmailListItem> = {
  title: 'Inbox/EmailListItem',
  component: EmailListItem,
};
export const UnreadEmail: StoryObj<typeof EmailListItem> = {
  args: { email: sampleEmails[0], onPress: (e) => console.log('Press:', e.id) },
};
export const ReadEmail: StoryObj<typeof EmailListItem> = {
  args: { email: sampleEmails[1], onPress: (e) => console.log('Press:', e.id) },
};

// --- ClassicInboxView Story ---
const meta5: Meta<typeof ClassicInboxView> = {
  title: 'Inbox/ClassicInboxView',
  component: ClassicInboxView,
  parameters: { layout: 'fullscreen' },
};
export const FullInbox: StoryObj<typeof ClassicInboxView> = {
  args: {
    emails: sampleEmails,
    activeCategory: 'inbox',
    activeLabel: 'primary',
    searchQuery: '',
    isRefreshing: false,
    onNavChange: (id) => console.log('Nav:', id),
    onLabelChange: (label) => console.log('Label:', label),
    onSearchChange: (q) => console.log('Search:', q),
    onFilterPress: () => console.log('Filter'),
    onEmailPress: (e) => console.log('Email:', e.id),
    onRefresh: () => console.log('Refresh'),
  },
};
