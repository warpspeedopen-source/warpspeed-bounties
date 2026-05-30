import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';

import { PollCreationModal } from './PollCreationModal';
import { PollMessage } from './PollMessage';
import { PollVotesBottomSheet } from './PollVotesBottomSheet';
import { PollActionButton } from './PollActionButton';
import { Poll, PollVoter, CreatePollInput } from './types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ME: PollVoter = { userId: 'u1', displayName: 'Alice Johnson', avatarUri: undefined };

const VOTERS: PollVoter[] = [
  { userId: 'u2', displayName: 'Bob Smith' },
  { userId: 'u3', displayName: 'Carol White' },
  { userId: 'u4', displayName: 'David Lee' },
  { userId: 'u5', displayName: 'Eva Martinez' },
  { userId: 'u6', displayName: 'Frank Brown' },
  { userId: 'u7', displayName: 'Grace Kim' },
];

const EMPTY_POLL: Poll = {
  id: 'poll_empty',
  question: 'Where should we hold the next team offsite?',
  options: [
    { id: 'o1', text: 'Bali, Indonesia', voters: [] },
    { id: 'o2', text: 'Lisbon, Portugal', voters: [] },
    { id: 'o3', text: 'Austin, Texas', voters: [] },
    { id: 'o4', text: 'Tokyo, Japan', voters: [] },
  ],
  allowMultipleChoice: false,
  createdAt: new Date().toISOString(),
  createdBy: VOTERS[0],
  totalGroupMembers: 12,
  isClosed: false,
};

const VOTED_POLL: Poll = {
  ...EMPTY_POLL,
  id: 'poll_voted',
  options: [
    { id: 'o1', text: 'Bali, Indonesia', voters: [ME, VOTERS[1], VOTERS[2]] },
    { id: 'o2', text: 'Lisbon, Portugal', voters: [VOTERS[3], VOTERS[4]] },
    { id: 'o3', text: 'Austin, Texas', voters: [VOTERS[5]] },
    { id: 'o4', text: 'Tokyo, Japan', voters: [] },
  ],
};

const MULTI_POLL: Poll = {
  id: 'poll_multi',
  question: 'Which features should we prioritise this sprint? (pick all that apply)',
  options: [
    { id: 'm1', text: 'Dark mode', voters: [ME, VOTERS[0]] },
    { id: 'm2', text: 'Push notifications', voters: [ME, VOTERS[1], VOTERS[2]] },
    { id: 'm3', text: 'Offline support', voters: [VOTERS[3]] },
  ],
  allowMultipleChoice: true,
  createdAt: new Date().toISOString(),
  createdBy: VOTERS[0],
  totalGroupMembers: 8,
  isClosed: false,
};

const CLOSED_POLL: Poll = {
  ...VOTED_POLL,
  id: 'poll_closed',
  isClosed: true,
};

// ── PollMessage stories ───────────────────────────────────────────────────────

const PollMessageMeta: Meta<typeof PollMessage> = {
  title: 'Poll/PollMessage',
  component: PollMessage,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#ECECEC', padding: 12 }}>
        <Story />
      </View>
    ),
  ],
};
export default PollMessageMeta;

export const Unvoted: StoryObj<typeof PollMessage> = {
  render: () => {
    const [poll, setPoll] = useState(EMPTY_POLL);
    const [sheetPoll, setSheetPoll] = useState<Poll | null>(null);

    const handleVote = (pollId: string, optionId: string) => {
      setPoll((prev) => ({
        ...prev,
        options: prev.options.map((opt) =>
          opt.id === optionId
            ? { ...opt, voters: [...opt.voters, ME] }
            : { ...opt, voters: opt.voters.filter((v) => v.userId !== ME.userId) }
        ),
      }));
    };

    return (
      <>
        <PollMessage
          poll={poll}
          currentUserId={ME.userId}
          onVote={handleVote}
          onViewVotes={setSheetPoll}
          isOutgoing={false}
        />
        <PollVotesBottomSheet
          poll={sheetPoll}
          visible={!!sheetPoll}
          onClose={() => setSheetPoll(null)}
        />
      </>
    );
  },
};

export const WithVotes: StoryObj<typeof PollMessage> = {
  render: () => {
    const [poll, setPoll] = useState(VOTED_POLL);
    const [sheetPoll, setSheetPoll] = useState<Poll | null>(null);

    const handleVote = (pollId: string, optionId: string) => {
      setPoll((prev) => ({
        ...prev,
        options: prev.options.map((opt) =>
          opt.id === optionId
            ? {
                ...opt,
                voters: opt.voters.some((v) => v.userId === ME.userId)
                  ? opt.voters.filter((v) => v.userId !== ME.userId)
                  : [...opt.voters, ME],
              }
            : { ...opt, voters: opt.voters.filter((v) => v.userId !== ME.userId) }
        ),
      }));
    };

    return (
      <>
        <PollMessage
          poll={poll}
          currentUserId={ME.userId}
          onVote={handleVote}
          onViewVotes={setSheetPoll}
          isOutgoing={false}
        />
        <PollVotesBottomSheet
          poll={sheetPoll}
          visible={!!sheetPoll}
          onClose={() => setSheetPoll(null)}
        />
      </>
    );
  },
};

export const MultiChoice: StoryObj<typeof PollMessage> = {
  render: () => {
    const [poll, setPoll] = useState(MULTI_POLL);
    const [sheetPoll, setSheetPoll] = useState<Poll | null>(null);

    const handleVote = (pollId: string, optionId: string) => {
      setPoll((prev) => ({
        ...prev,
        options: prev.options.map((opt) => {
          if (opt.id !== optionId) return opt;
          const alreadyVoted = opt.voters.some((v) => v.userId === ME.userId);
          return {
            ...opt,
            voters: alreadyVoted
              ? opt.voters.filter((v) => v.userId !== ME.userId)
              : [...opt.voters, ME],
          };
        }),
      }));
    };

    return (
      <>
        <PollMessage
          poll={poll}
          currentUserId={ME.userId}
          onVote={handleVote}
          onViewVotes={setSheetPoll}
          isOutgoing={true}
        />
        <PollVotesBottomSheet
          poll={sheetPoll}
          visible={!!sheetPoll}
          onClose={() => setSheetPoll(null)}
        />
      </>
    );
  },
};

export const Closed: StoryObj<typeof PollMessage> = {
  render: () => {
    const [sheetPoll, setSheetPoll] = useState<Poll | null>(null);
    return (
      <>
        <PollMessage
          poll={CLOSED_POLL}
          currentUserId={ME.userId}
          onVote={() => {}}
          onViewVotes={setSheetPoll}
          isOutgoing={false}
        />
        <PollVotesBottomSheet
          poll={sheetPoll}
          visible={!!sheetPoll}
          onClose={() => setSheetPoll(null)}
        />
      </>
    );
  },
};

// ── PollCreationModal stories ─────────────────────────────────────────────────

export const CreationModal: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [lastInput, setLastInput] = useState<CreatePollInput | null>(null);

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <TouchableOpacity
          style={storyStyles.openButton}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={storyStyles.openButtonText}>Open Poll Creation</Text>
        </TouchableOpacity>

        {lastInput && (
          <View style={storyStyles.resultBox}>
            <Text style={storyStyles.resultTitle}>Last Created Poll</Text>
            <Text style={storyStyles.resultText}>Q: {lastInput.question}</Text>
            <Text style={storyStyles.resultText}>
              Options: {lastInput.optionTexts.join(', ')}
            </Text>
            <Text style={storyStyles.resultText}>
              Multiple choice: {lastInput.allowMultipleChoice ? 'Yes' : 'No'}
            </Text>
          </View>
        )}

        <PollCreationModal
          visible={open}
          onClose={() => setOpen(false)}
          onSubmit={(input) => {
            setLastInput(input);
            setOpen(false);
          }}
        />
      </View>
    );
  },
};

// ── PollActionButton stories ──────────────────────────────────────────────────

export const ActionButton: StoryObj = {
  render: () => (
    <View style={{ flexDirection: 'row', padding: 24, gap: 16 }}>
      <PollActionButton onPress={() => Alert.alert('Poll', 'Open creation modal')} />
      <PollActionButton onPress={() => {}} disabled />
    </View>
  ),
};

// ── Full integration story ────────────────────────────────────────────────────

export const FullChatIntegration: StoryObj = {
  render: () => {
    const [polls, setPolls] = useState<Poll[]>([VOTED_POLL, MULTI_POLL]);
    const [creationVisible, setCreationVisible] = useState(false);
    const [sheetPoll, setSheetPoll] = useState<Poll | null>(null);

    const handleVote = (pollId: string, optionId: string) => {
      setPolls((prev) =>
        prev.map((poll) => {
          if (poll.id !== pollId || poll.isClosed) return poll;
          const alreadyVoted = poll.options
            .find((o) => o.id === optionId)
            ?.voters.some((v) => v.userId === ME.userId) ?? false;

          return {
            ...poll,
            options: poll.options.map((opt) => {
              if (alreadyVoted && opt.id === optionId) {
                return { ...opt, voters: opt.voters.filter((v) => v.userId !== ME.userId) };
              }
              if (!alreadyVoted) {
                if (!poll.allowMultipleChoice && opt.id !== optionId) {
                  return { ...opt, voters: opt.voters.filter((v) => v.userId !== ME.userId) };
                }
                if (opt.id === optionId) {
                  return { ...opt, voters: [...opt.voters, ME] };
                }
              }
              return opt;
            }),
          };
        })
      );
    };

    const handleCreate = (input: CreatePollInput) => {
      const newPoll: Poll = {
        id: `poll_${Date.now()}`,
        question: input.question,
        options: input.optionTexts.map((t, i) => ({ id: `opt_${i}`, text: t, voters: [] })),
        allowMultipleChoice: input.allowMultipleChoice,
        createdAt: new Date().toISOString(),
        createdBy: ME,
        totalGroupMembers: 12,
        isClosed: false,
      };
      setPolls((prev) => [...prev, newPoll]);
      setCreationVisible(false);
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#ECECEC' }}>
        {/* Simulated chat messages */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={storyStyles.timestamp}>Today 10:30 AM</Text>
          {polls.map((poll, i) => (
            <PollMessage
              key={poll.id}
              poll={poll}
              currentUserId={ME.userId}
              onVote={handleVote}
              onViewVotes={setSheetPoll}
              isOutgoing={i % 2 === 1}
            />
          ))}
        </ScrollView>

        {/* Simulated input bar */}
        <View style={storyStyles.inputBar}>
          <PollActionButton onPress={() => setCreationVisible(true)} />
          <View style={storyStyles.textInputPlaceholder}>
            <Text style={storyStyles.textInputPlaceholderText}>Type a message…</Text>
          </View>
        </View>

        <PollCreationModal
          visible={creationVisible}
          onClose={() => setCreationVisible(false)}
          onSubmit={handleCreate}
        />

        <PollVotesBottomSheet
          poll={sheetPoll}
          visible={!!sheetPoll}
          onClose={() => setSheetPoll(null)}
        />
      </View>
    );
  },
};

const storyStyles = StyleSheet.create({
  openButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    width: '100%',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  resultText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  textInputPlaceholder: {
    flex: 1,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginLeft: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInputPlaceholderText: {
    fontSize: 15,
    color: '#AEAEB2',
  },
});
