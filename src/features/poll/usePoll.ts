import { useState, useCallback } from 'react';
import { Poll, PollVoter, CreatePollInput } from './types';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface UsePollOptions {
  initialPolls?: Poll[];
  onPollCreated?: (poll: Poll) => void;
  onVoteCast?: (pollId: string, optionId: string, voter: PollVoter, action: 'vote' | 'unvote') => void;
}

export function usePoll(currentUser: PollVoter, options: UsePollOptions = {}) {
  const { initialPolls = [], onPollCreated, onVoteCast } = options;

  const [polls, setPolls] = useState<Record<string, Poll>>(
    () => Object.fromEntries(initialPolls.map((p) => [p.id, p]))
  );

  const createPoll = useCallback(
    (input: CreatePollInput, totalGroupMembers: number): Poll => {
      const poll: Poll = {
        id: generateId('poll'),
        question: input.question,
        options: input.optionTexts.map((text) => ({
          id: generateId('opt'),
          text,
          voters: [],
        })),
        allowMultipleChoice: input.allowMultipleChoice,
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
        totalGroupMembers,
        isClosed: false,
      };
      setPolls((prev) => ({ ...prev, [poll.id]: poll }));
      onPollCreated?.(poll);
      return poll;
    },
    [currentUser, onPollCreated]
  );

  const vote = useCallback(
    (pollId: string, optionId: string) => {
      setPolls((prev) => {
        const poll = prev[pollId];
        if (!poll || poll.isClosed) return prev;

        const targetOption = poll.options.find((o) => o.id === optionId);
        const alreadyVoted = targetOption?.voters.some((v) => v.userId === currentUser.userId) ?? false;

        const newOptions = poll.options.map((opt) => {
          if (alreadyVoted && opt.id === optionId) {
            onVoteCast?.(pollId, optionId, currentUser, 'unvote');
            return { ...opt, voters: opt.voters.filter((v) => v.userId !== currentUser.userId) };
          }
          if (!alreadyVoted) {
            if (!poll.allowMultipleChoice && opt.id !== optionId) {
              return { ...opt, voters: opt.voters.filter((v) => v.userId !== currentUser.userId) };
            }
            if (opt.id === optionId) {
              onVoteCast?.(pollId, optionId, currentUser, 'vote');
              return { ...opt, voters: [...opt.voters, currentUser] };
            }
          }
          return opt;
        });

        return { ...prev, [pollId]: { ...poll, options: newOptions } };
      });
    },
    [currentUser, onVoteCast]
  );

  const updatePoll = useCallback((updatedPoll: Poll) => {
    setPolls((prev) => ({ ...prev, [updatedPoll.id]: updatedPoll }));
  }, []);

  const closePoll = useCallback((pollId: string) => {
    setPolls((prev) => {
      const poll = prev[pollId];
      if (!poll) return prev;
      return { ...prev, [pollId]: { ...poll, isClosed: true } };
    });
  }, []);

  const getPoll = useCallback((pollId: string): Poll | undefined => polls[pollId], [polls]);

  return { polls, createPoll, vote, updatePoll, closePoll, getPoll };
}
