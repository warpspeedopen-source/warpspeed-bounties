/**
 * Poll Stories
 * Storybook stories for all poll-related components
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, SafeAreaView } from 'react-native';
import { PollActionButton } from './PollActionButton';
import { PollCreationModal } from './PollCreationModal';
import { PollMessage } from './PollMessage';
import { PollResultBar } from './PollResultBar';
import { PollVotesBottomSheet } from './PollVotesBottomSheet';
import { usePoll } from '../hooks/usePoll';
import { PollCreateInput } from '../types';
import {
  MOCK_POLL,
  MOCK_MULTI_POLL,
  MOCK_USER_VOTED_POLL,
  MOCK_CURRENT_USER,
  MOCK_PARTICIPANTS,
} from '../constants';

/**
 * Story: PollActionButton
 * Renders the poll action button used in the chat input area
 */
export const PollActionButtonStory: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Poll Action Button</Text>
      <PollActionButton onPress={() => setShowModal(true)} />
      <PollCreationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(input: PollCreateInput) => {
          console.log('Poll created:', input);
          setShowModal(false);
        }}
      />
    </SafeAreaView>
  );
};

/**
 * Story: PollCreationModal
 * Shows the full poll creation flow
 */
export const PollCreationModalStory: React.FC = () => {
  const [visible, setVisible] = useState(true);

  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Poll Creation Modal</Text>
      <PollActionButton onPress={() => setVisible(true)} />
      <PollCreationModal
        visible={visible}
        onClose={() => setVisible(false)}
        onSubmit={(input: PollCreateInput) => {
          console.log('Poll created:', input);
          setVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

/**
 * Story: Single-Choice Poll Message
 * Displays a poll in single-choice voting mode
 */
export const SingleChoicePollStory: React.FC = () => {
  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Single-Choice Poll</Text>
      <ScrollView contentContainerStyle={storyStyles.scrollContent}>
        <PollMessage
          poll={MOCK_POLL}
          currentUserId={MOCK_CURRENT_USER.userId}
          totalParticipants={MOCK_PARTICIPANTS.length}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Story: Multiple-Choice Poll Message
 * Displays a poll in multiple-choice voting mode
 */
export const MultipleChoicePollStory: React.FC = () => {
  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Multiple-Choice Poll</Text>
      <ScrollView contentContainerStyle={storyStyles.scrollContent}>
        <PollMessage
          poll={MOCK_MULTI_POLL}
          currentUserId={MOCK_CURRENT_USER.userId}
          totalParticipants={MOCK_PARTICIPANTS.length}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Story: Poll with User Vote Already Cast
 * Shows the poll result view when the current user has already voted
 */
export const VotedPollStory: React.FC = () => {
  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Poll After Voting</Text>
      <ScrollView contentContainerStyle={storyStyles.scrollContent}>
        <PollMessage
          poll={MOCK_USER_VOTED_POLL}
          currentUserId={MOCK_CURRENT_USER.userId}
          totalParticipants={MOCK_PARTICIPANTS.length}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Story: Closed Poll
 * Shows the poll in its closed state (no voting allowed)
 */
export const ClosedPollStory: React.FC = () => {
  const closedPoll = { ...MOCK_POLL, status: 'closed' as const };

  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Closed Poll</Text>
      <ScrollView contentContainerStyle={storyStyles.scrollContent}>
        <PollMessage
          poll={closedPoll}
          currentUserId={MOCK_CURRENT_USER.userId}
          totalParticipants={MOCK_PARTICIPANTS.length}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Story: PollResultBar (individual)
 * Shows individual result bars in various states
 */
export const ResultBarStory: React.FC = () => {
  const mockResult = {
    option: { id: 'opt-1', text: 'Central Park', voters: [] },
    voteCount: 3,
    percentage: 43,
    isSelected: true,
    voters: [
      { userId: 'user-2', displayName: 'Sarah' },
      { userId: 'user-3', displayName: 'Alex' },
      { userId: 'user-4', displayName: 'Maria' },
    ],
  };

  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Result Bar Variants</Text>
      <View style={storyStyles.scrollContent}>
        <PollResultBar
          result={mockResult}
          index={0}
          maxVotes={3}
          isSelected={true}
          isLeading={true}
          showVoters={true}
        />
        <PollResultBar
          result={{
            ...mockResult,
            option: { id: 'opt-2', text: 'Rooftop Lounge', voters: [] },
            voteCount: 2,
            percentage: 29,
            isSelected: false,
          }}
          index={1}
          maxVotes={3}
          isSelected={false}
          isLeading={false}
          showVoters={true}
        />
        <PollResultBar
          result={{
            ...mockResult,
            option: { id: 'opt-3', text: 'Beach Resort', voters: [] },
            voteCount: 0,
            percentage: 0,
            isSelected: false,
          }}
          index={2}
          maxVotes={3}
          isSelected={false}
          isLeading={false}
          showVoters={false}
        />
      </View>
    </SafeAreaView>
  );
};

/**
 * Story: Full Poll Experience (composed view)
 * Complete interactive demo with creation and voting
 */
export const FullPollExperienceStory: React.FC = () => {
  const [showCreationModal, setShowCreationModal] = useState(false);
  const { poll, results, createPoll, startCreation, cancelCreation, castVote } = usePoll({
    initialPoll: MOCK_POLL,
    currentUserId: MOCK_CURRENT_USER.userId,
    totalParticipants: MOCK_PARTICIPANTS.length,
  });

  const handleCreatePoll = (input: PollCreateInput) => {
    createPoll(input, MOCK_CURRENT_USER);
    setShowCreationModal(false);
  };

  return (
    <SafeAreaView style={storyStyles.container}>
      <Text style={storyStyles.storyTitle}>Full Poll Experience</Text>
      <ScrollView contentContainerStyle={storyStyles.scrollContent}>
        <PollActionButton onPress={() => setShowCreationModal(true)} />

        {poll && (
          <View style={{ marginTop: 20 }}>
            <PollMessage
              poll={poll}
              currentUserId={MOCK_CURRENT_USER.userId}
              totalParticipants={MOCK_PARTICIPANTS.length}
            />
          </View>
        )}
      </ScrollView>

      <PollCreationModal
        visible={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSubmit={handleCreatePoll}
      />
    </SafeAreaView>
  );
};

const storyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingVertical: 16,
  },
  scrollContent: {
    padding: 16,
  },
});

export default {
  title: 'Messenger Poll',
  component: PollMessage,
};
