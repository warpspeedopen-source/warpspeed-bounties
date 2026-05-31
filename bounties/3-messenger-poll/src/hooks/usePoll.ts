/**
 * usePoll Hook
 * Manages poll state including creation, voting, and results computation
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Poll,
  PollOption,
  PollVoter,
  PollCreateInput,
  PollVoteInput,
  PollResults,
  PollOptionResult,
  PollVoteMode,
  PollStatus,
} from '../types';
import {
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  POLL_QUESTION_MAX_LENGTH,
} from '../constants';

interface UsePollOptions {
  initialPoll?: Poll;
  currentUserId?: string;
  totalParticipants?: number;
}

interface UsePollReturn {
  poll: Poll | null;
  results: PollResults | null;
  isCreating: boolean;
  isVoting: boolean;
  error: string | null;
  startCreation: () => void;
  cancelCreation: () => void;
  createPoll: (input: PollCreateInput, creator: PollVoter) => Poll;
  castVote: (optionIds: string[], voter: PollVoter) => void;
  closePoll: () => void;
  hasUserVoted: boolean;
  selectedOptionIds: string[];
  validateCreationInput: (input: PollCreateInput) => string | null;
}

let pollIdCounter = 100;
let optionIdCounter = 100;

const generatePollId = () => `poll-${++pollIdCounter}`;
const generateOptionId = () => `opt-${++optionIdCounter}`;

export const usePoll = (options: UsePollOptions = {}): UsePollReturn => {
  const { initialPoll, currentUserId, totalParticipants = 8 } = options;

  const [poll, setPoll] = useState<Poll | null>(initialPoll ?? null);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validate poll creation input */
  const validateCreationInput = useCallback((input: PollCreateInput): string | null => {
    if (!input.question || input.question.trim().length === 0) {
      return 'Poll question is required.';
    }
    if (input.question.length > POLL_QUESTION_MAX_LENGTH) {
      return `Question must be ${POLL_QUESTION_MAX_LENGTH} characters or less.`;
    }
    const validOptions = input.options.filter((o) => o.trim().length > 0);
    if (validOptions.length < MIN_POLL_OPTIONS) {
      return `At least ${MIN_POLL_OPTIONS} options are required.`;
    }
    if (validOptions.length > MAX_POLL_OPTIONS) {
      return `Maximum ${MAX_POLL_OPTIONS} options allowed.`;
    }
    return null;
  }, []);

  /** Start poll creation mode */
  const startCreation = useCallback(() => {
    setIsCreating(true);
    setError(null);
  }, []);

  /** Cancel poll creation mode */
  const cancelCreation = useCallback(() => {
    setIsCreating(false);
    setError(null);
  }, []);

  /** Create a new poll */
  const createPoll = useCallback(
    (input: PollCreateInput, creator: PollVoter): Poll => {
      const validationError = validateCreationInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      const validOptions = input.options.filter((o) => o.trim().length > 0);

      const newPoll: Poll = {
        id: generatePollId(),
        question: input.question.trim(),
        options: validOptions.map((text) => ({
          id: generateOptionId(),
          text: text.trim(),
          voters: [],
        })),
        voteMode: input.voteMode,
        status: 'active',
        createdBy: creator,
        createdAt: new Date(),
        totalParticipants,
      };

      setPoll(newPoll);
      setIsCreating(false);
      setError(null);
      return newPoll;
    },
    [totalParticipants, validateCreationInput]
  );

  /** Cast a vote on the poll */
  const castVote = useCallback(
    (optionIds: string[], voter: PollVoter) => {
      if (!poll) {
        setError('No active poll to vote on.');
        return;
      }
      if (poll.status !== 'active') {
        setError('This poll is closed.');
        return;
      }

      setIsVoting(true);

      setPoll((prev) => {
        if (!prev) return null;

        const updatedOptions = prev.options.map((option) => {
          // Remove existing votes from this user on ALL options (for single-choice toggling)
          const filteredVoters = option.voters.filter((v) => v.userId !== voter.userId);

          // Add vote if this option is selected
          if (optionIds.includes(option.id)) {
            return { ...option, voters: [...filteredVoters, voter] };
          }
          return { ...option, voters: filteredVoters };
        });

        return { ...prev, options: updatedOptions };
      });

      setIsVoting(false);
      setError(null);
    },
    [poll]
  );

  /** Close the poll */
  const closePoll = useCallback(() => {
    setPoll((prev) => (prev ? { ...prev, status: 'closed' as PollStatus } : null));
  }, []);

  /** Check if the current user has voted */
  const hasUserVoted = useMemo(() => {
    if (!poll || !currentUserId) return false;
    return poll.options.some((opt) => opt.voters.some((v) => v.userId === currentUserId));
  }, [poll, currentUserId]);

  /** Get the IDs of options the current user voted for */
  const selectedOptionIds = useMemo(() => {
    if (!poll || !currentUserId) return [];
    return poll.options
      .filter((opt) => opt.voters.some((v) => v.userId === currentUserId))
      .map((opt) => opt.id);
  }, [poll, currentUserId]);

  /** Compute full results */
  const results = useMemo((): PollResults | null => {
    if (!poll) return null;

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voters.length, 0);

    const optionResults: PollOptionResult[] = poll.options.map((option) => {
      const voteCount = option.voters.length;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

      return {
        option,
        voteCount,
        percentage,
        isSelected: currentUserId
          ? option.voters.some((v) => v.userId === currentUserId)
          : false,
        voters: option.voters,
      };
    });

    return {
      poll,
      optionResults,
      totalVotes,
      hasVoted: hasUserVoted,
      selectedOptionIds,
    };
  }, [poll, currentUserId, hasUserVoted, selectedOptionIds]);

  return {
    poll,
    results,
    isCreating,
    isVoting,
    error,
    startCreation,
    cancelCreation,
    createPoll,
    castVote,
    closePoll,
    hasUserVoted,
    selectedOptionIds,
    validateCreationInput,
  };
};
