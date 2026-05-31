import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { PollMessage } from './PollMessage';
import { PollCreationModal } from './PollCreationModal';
import { PollVotesBottomSheet } from './PollVotesBottomSheet';
import { Poll, PollOption, Voter } from '../types';

export default {
  title: 'Components/MessengerPoll',
  component: PollMessage,
};

// --- MOCK DATA ---
const currentUser: Voter = {
  id: 'u1',
  name: 'Sagar Maurya',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
  initials: 'SM',
};

const userBob: Voter = {
  id: 'u2',
  name: 'Bob Johnson',
  avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
  initials: 'BJ',
};

const userAlice: Voter = {
  id: 'u3',
  name: 'Alice Smith',
  initials: 'AS',
};

const userCharlie: Voter = {
  id: 'u4',
  name: 'Charlie Brown',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  initials: 'CB',
};

const userDiana: Voter = {
  id: 'u5',
  name: 'Diana Prince',
  initials: 'DP',
};

// 1. Single Choice Poll Mock
const mockSingleChoicePoll: Poll = {
  id: 'poll-1',
  question: 'Where should we go for the team lunch today?',
  allowMultipleAnswers: false,
  createdAt: '2026-05-31T12:00:00Z',
  creator: userBob,
  options: [
    {
      id: 'opt-1-1',
      text: 'Italian Bistro (Pizzas and Pastas)',
      votes: [userBob, userAlice],
    },
    {
      id: 'opt-1-2',
      text: 'Sushi Garden (Fresh Sushi platter)',
      votes: [userCharlie],
    },
    {
      id: 'opt-1-3',
      text: 'Spicy Palace (Curries and Tandoori)',
      votes: [],
    },
  ],
};

// 2. Multiple Choice Poll Mock
const mockMultipleChoicePoll: Poll = {
  id: 'poll-2',
  question: 'Which features should we prioritize for the next release sprint?',
  allowMultipleAnswers: true,
  createdAt: '2026-05-31T10:00:00Z',
  creator: currentUser,
  options: [
    {
      id: 'opt-2-1',
      text: 'Biometric Locking (PIN/FaceID)',
      votes: [currentUser, userBob, userAlice],
    },
    {
      id: 'opt-2-2',
      text: 'Email Threads & Nested API',
      votes: [currentUser, userCharlie, userDiana],
    },
    {
      id: 'opt-2-3',
      text: 'Attachment PDF/Image Summarizer',
      votes: [userBob, userDiana],
    },
    {
      id: 'opt-2-4',
      text: 'Audio Notes Recording UI',
      votes: [],
    },
  ],
};

// 3. Empty Poll Mock (No votes yet)
const mockEmptyPoll: Poll = {
  id: 'poll-3',
  question: 'Are we good to push the current build to production stage?',
  allowMultipleAnswers: false,
  createdAt: '2026-05-31T15:00:00Z',
  creator: userAlice,
  options: [
    {
      id: 'opt-3-1',
      text: 'Yes, fully tested and ready',
      votes: [],
    },
    {
      id: 'opt-3-2',
      text: 'No, let\'s wait for hotfixes',
      votes: [],
    },
  ],
};

// --- STORY COMPONENTS ---

// Wrapper helper to supply interactive React state for stories
const InteractiveContainer: React.FC<{ children: (args: {
  poll: Poll;
  setPoll: React.Dispatch<React.SetStateAction<Poll>>;
  onVote: (pollId: string, optionId: string) => void;
  openVotersSheet: (option: PollOption) => void;
}) => React.ReactNode }> = ({ children }) => {
  const [poll, setPoll] = useState<Poll>(mockMultipleChoicePoll);
  const [selectedOptionForSheet, setSelectedOptionForSheet] = useState<PollOption | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleVote = (pollId: string, optionId: string) => {
    setPoll((prevPoll) => {
      const updatedOptions = prevPoll.options.map((option) => {
        if (option.id !== optionId) {
          // If single choice and voting on another option, remove user vote from this option
          if (!prevPoll.allowMultipleAnswers) {
            return {
              ...option,
              votes: option.votes.filter((voter) => voter.id !== currentUser.id),
            };
          }
          return option;
        }

        const alreadyVoted = option.votes.some((voter) => voter.id === currentUser.id);
        let newVotes = [...option.votes];

        if (alreadyVoted) {
          // Toggle off
          newVotes = newVotes.filter((voter) => voter.id !== currentUser.id);
        } else {
          // Toggle on
          newVotes.push(currentUser);
        }

        return {
          ...option,
          votes: newVotes,
        };
      });

      return {
        ...prevPoll,
        options: updatedOptions,
      };
    });
  };

  const handleShowVoters = (option: PollOption) => {
    setSelectedOptionForSheet(option);
    setSheetVisible(true);
  };

  return (
    <View style={styles.interactiveContainer}>
      {children({ poll, setPoll, onVote: handleVote, openVotersSheet: handleShowVoters })}
      
      <PollVotesBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        option={selectedOptionForSheet}
      />
    </View>
  );
};

// 1. Static Showcase Stories
export const SingleChoiceView = () => {
  const [poll, setPoll] = useState(mockSingleChoicePoll);
  const [activeOption, setActiveOption] = useState<PollOption | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleVote = (_: string, optionId: string) => {
    setPoll((prev) => ({
      ...prev,
      options: prev.options.map((opt) => {
        const hasVoted = opt.votes.some((v) => v.id === currentUser.id);
        if (opt.id === optionId) {
          return {
            ...opt,
            votes: hasVoted ? opt.votes.filter((v) => v.id !== currentUser.id) : [...opt.votes, currentUser],
          };
        } else {
          return {
            ...opt,
            votes: opt.votes.filter((v) => v.id !== currentUser.id),
          };
        }
      }),
    }));
  };

  return (
    <ScrollView style={styles.storybookBg} contentContainerStyle={styles.centerContent}>
      <Text style={styles.sectionTitle}>Single Choice Poll (Active State)</Text>
      <PollMessage
        poll={poll}
        currentUser={currentUser}
        onVote={handleVote}
        onShowVoters={(opt) => {
          setActiveOption(opt);
          setSheetOpen(true);
        }}
      />
      <PollVotesBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        option={activeOption}
      />
    </ScrollView>
  );
};

export const EmptyStateView = () => {
  const [poll, setPoll] = useState(mockEmptyPoll);
  return (
    <ScrollView style={styles.storybookBg} contentContainerStyle={styles.centerContent}>
      <Text style={styles.sectionTitle}>Empty Poll (No Votes State)</Text>
      <PollMessage
        poll={poll}
        currentUser={currentUser}
        onVote={(_, optionId) => {
          setPoll((prev) => ({
            ...prev,
            options: prev.options.map((opt) => {
              if (opt.id === optionId) {
                const voted = opt.votes.some((v) => v.id === currentUser.id);
                return {
                  ...opt,
                  votes: voted ? [] : [currentUser],
                };
              }
              return opt;
            }),
          }));
        }}
        onShowVoters={() => {}}
      />
    </ScrollView>
  );
};

// 2. Full interactive showcase playground story
export const FullPlayground = () => {
  const [creationModalVisible, setCreationModalVisible] = useState(false);
  const [activePolls, setActivePolls] = useState<Poll[]>([
    mockSingleChoicePoll,
    mockMultipleChoicePoll,
  ]);
  const [activeOption, setActiveOption] = useState<PollOption | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleVote = (pollId: string, optionId: string) => {
    setActivePolls((prevPolls) =>
      prevPolls.map((p) => {
        if (p.id !== pollId) return p;

        return {
          ...p,
          options: p.options.map((opt) => {
            const hasVoted = opt.votes.some((v) => v.id === currentUser.id);
            if (opt.id === optionId) {
              return {
                ...opt,
                votes: hasVoted ? opt.votes.filter((v) => v.id !== currentUser.id) : [...opt.votes, currentUser],
              };
            } else {
              return p.allowMultipleAnswers
                ? opt
                : { ...opt, votes: opt.votes.filter((v) => v.id !== currentUser.id) };
            }
          }),
        };
      })
    );
  };

  const handleCreatePoll = (question: string, optionsText: string[], allowMultiple: boolean) => {
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      allowMultipleAnswers: allowMultiple,
      createdAt: new Date().toISOString(),
      creator: currentUser,
      options: optionsText.map((txt, index) => ({
        id: `opt-${Date.now()}-${index}`,
        text: txt,
        votes: [],
      })),
    };
    setActivePolls([newPoll, ...activePolls]);
  };

  return (
    <View style={styles.playgroundContainer}>
      <ScrollView
        style={styles.storybookBg}
        contentContainerStyle={styles.playgroundContent}
      >
        <Text style={styles.playgroundTitle}>Messenger Poll Dashboard</Text>
        <Text style={styles.playgroundSubtitle}>
          Simulates real-time messaging thread interaction
        </Text>

        {/* Create Trigger Button */}
        <TouchableOpacity
          style={styles.floatingActionBtn}
          onPress={() => setCreationModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.floatingActionText}>Create New Group Poll</Text>
        </TouchableOpacity>

        {/* Display all active polls in thread */}
        <View style={styles.pollsList}>
          {activePolls.map((poll) => (
            <PollMessage
              key={poll.id}
              poll={poll}
              currentUser={currentUser}
              onVote={handleVote}
              onShowVoters={(opt) => {
                setActiveOption(opt);
                setSheetOpen(true);
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Creation Modal sheet */}
      <PollCreationModal
        visible={creationModalVisible}
        onClose={() => setCreationModalVisible(false)}
        onCreatePoll={handleCreatePoll}
      />

      {/* Voter stack detail BottomSheet */}
      <PollVotesBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        option={activeOption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  interactiveContainer: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  storybookBg: {
    flex: 1,
    backgroundColor: '#070A12', // Rich background contrast
  },
  centerContent: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  playgroundContainer: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  playgroundContent: {
    paddingTop: 30,
    paddingBottom: 60,
    alignItems: 'center',
  },
  playgroundTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  playgroundSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  floatingActionBtn: {
    backgroundColor: '#6366F1', // Premium Indigo
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pollsList: {
    width: '100%',
    gap: 16,
  },
});
