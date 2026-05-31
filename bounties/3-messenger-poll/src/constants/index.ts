/**
 * Messenger Group Chat Poll - Constants and Mock Data
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import { Poll, PollVoter, PollCreateInput } from '../types';

/** Maximum number of poll options allowed */
export const MAX_POLL_OPTIONS = 12;

/** Minimum number of poll options required */
export const MIN_POLL_OPTIONS = 2;

/** Maximum character length for poll question */
export const POLL_QUESTION_MAX_LENGTH = 255;

/** Maximum character length for a single poll option */
export const POLL_OPTION_MAX_LENGTH = 100;

/** Colors used for result bars */
export const RESULT_BAR_COLORS = [
  '#4285F4',
  '#EA4335',
  '#FBBC04',
  '#34A853',
  '#9C27B0',
  '#FF6D00',
  '#00BCD4',
  '#E91E63',
  '#3F51B5',
  '#009688',
  '#FF5722',
  '#607D8B',
];

/** Mock current user */
export const MOCK_CURRENT_USER: PollVoter = {
  userId: 'user-1',
  displayName: 'John Doe',
  avatarUri: 'https://i.pravatar.cc/150?u=user-1',
};

/** Mock group participants */
export const MOCK_PARTICIPANTS: PollVoter[] = [
  MOCK_CURRENT_USER,
  { userId: 'user-2', displayName: 'Sarah Chen', avatarUri: 'https://i.pravatar.cc/150?u=user-2' },
  { userId: 'user-3', displayName: 'Alex Rivera', avatarUri: 'https://i.pravatar.cc/150?u=user-3' },
  { userId: 'user-4', displayName: 'Maria Garcia', avatarUri: 'https://i.pravatar.cc/150?u=user-4' },
  { userId: 'user-5', displayName: 'James Wilson', avatarUri: 'https://i.pravatar.cc/150?u=user-5' },
  { userId: 'user-6', displayName: 'Emily Park', avatarUri: 'https://i.pravatar.cc/150?u=user-6' },
  { userId: 'user-7', displayName: 'David Kim', avatarUri: 'https://i.pravatar.cc/150?u=user-7' },
  { userId: 'user-8', displayName: 'Lisa Thompson', avatarUri: 'https://i.pravatar.cc/150?u=user-8' },
];

/** Mock poll data for stories and testing */
export const MOCK_POLL: Poll = {
  id: 'poll-1',
  question: 'Where should we hold the team offsite?',
  options: [
    {
      id: 'opt-1',
      text: 'Central Park',
      voters: [
        { userId: 'user-2', displayName: 'Sarah Chen', avatarUri: 'https://i.pravatar.cc/150?u=user-2' },
        { userId: 'user-3', displayName: 'Alex Rivera', avatarUri: 'https://i.pravatar.cc/150?u=user-3' },
        { userId: 'user-4', displayName: 'Maria Garcia', avatarUri: 'https://i.pravatar.cc/150?u=user-4' },
      ],
    },
    {
      id: 'opt-2',
      text: 'Rooftop Lounge',
      voters: [
        { userId: 'user-5', displayName: 'James Wilson', avatarUri: 'https://i.pravatar.cc/150?u=user-5' },
        { userId: 'user-6', displayName: 'Emily Park', avatarUri: 'https://i.pravatar.cc/150?u=user-6' },
      ],
    },
    {
      id: 'opt-3',
      text: 'Beach Resort',
      voters: [
        { userId: 'user-7', displayName: 'David Kim', avatarUri: 'https://i.pravatar.cc/150?u=user-7' },
      ],
    },
    {
      id: 'opt-4',
      text: 'Mountain Cabin',
      voters: [],
    },
  ],
  voteMode: 'single',
  status: 'active',
  createdBy: { userId: 'user-2', displayName: 'Sarah Chen', avatarUri: 'https://i.pravatar.cc/150?u=user-2' },
  createdAt: new Date('2026-05-29T10:00:00'),
  totalParticipants: 8,
};

/** Mock multiple-choice poll */
export const MOCK_MULTI_POLL: Poll = {
  id: 'poll-2',
  question: 'Which frontend frameworks do you have experience with?',
  options: [
    {
      id: 'opt-m1',
      text: 'React',
      voters: [
        { userId: 'user-1', displayName: 'John Doe' },
        { userId: 'user-2', displayName: 'Sarah Chen' },
        { userId: 'user-3', displayName: 'Alex Rivera' },
      ],
    },
    {
      id: 'opt-m2',
      text: 'Vue',
      voters: [
        { userId: 'user-1', displayName: 'John Doe' },
        { userId: 'user-4', displayName: 'Maria Garcia' },
      ],
    },
    {
      id: 'opt-m3',
      text: 'Angular',
      voters: [
        { userId: 'user-5', displayName: 'James Wilson' },
      ],
    },
    {
      id: 'opt-m4',
      text: 'Svelte',
      voters: [
        { userId: 'user-3', displayName: 'Alex Rivera' },
        { userId: 'user-6', displayName: 'Emily Park' },
      ],
    },
    {
      id: 'opt-m5',
      text: 'Solid',
      voters: [],
    },
  ],
  voteMode: 'multiple',
  status: 'active',
  createdBy: MOCK_CURRENT_USER,
  createdAt: new Date('2026-05-29T14:30:00'),
  totalParticipants: 8,
};

/** Mock poll that the current user has voted on (single choice) */
export const MOCK_USER_VOTED_POLL: Poll = {
  ...MOCK_POLL,
  id: 'poll-3',
  question: 'Preferred lunch time?',
  options: [
    {
      id: 'opt-v1',
      text: '12:00 PM',
      voters: [
        MOCK_CURRENT_USER,
        { userId: 'user-2', displayName: 'Sarah Chen' },
        { userId: 'user-4', displayName: 'Maria Garcia' },
      ],
    },
    {
      id: 'opt-v2',
      text: '1:00 PM',
      voters: [
        { userId: 'user-3', displayName: 'Alex Rivera' },
        { userId: 'user-5', displayName: 'James Wilson' },
      ],
    },
    {
      id: 'opt-v3',
      text: '2:00 PM',
      voters: [
        { userId: 'user-6', displayName: 'Emily Park' },
      ],
    },
  ],
};
