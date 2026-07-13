import { makeAutoObservable } from 'mobx';
import {
  Poll,
  PollOption,
  Vote,
  PollResult,
  PollCreationData,
  POLL_COLORS,
} from '../types';

let pollCounter = 0;

function generateId(): string {
  pollCounter += 1;
  return `poll_${Date.now()}_${pollCounter}`;
}

function optionId(pollId: string, index: number): string {
  return `${pollId}_opt_${index}`;
}

export class PollStore {
  polls: Map<string, Poll> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

  createPoll(data: PollCreationData, createdBy: string): Poll {
    const id = generateId();
    const options: PollOption[] = data.options.map((text, i) => ({
      id: optionId(id, i),
      text,
      voters: [],
    }));

    const poll: Poll = {
      id,
      question: data.question,
      options,
      isMultiChoice: data.isMultiChoice,
      createdBy,
      createdAt: Date.now(),
      userVote: undefined,
    };

    this.polls.set(id, poll);
    return poll;
  }

  getPoll(pollId: string): Poll | undefined {
    return this.polls.get(pollId);
  }

  castVote(pollId: string, optionIds: string[], userId: string, username: string): boolean {
    const poll = this.polls.get(pollId);
    if (!poll) return false;

    if (poll.userVote) return false;

    if (!poll.isMultiChoice && optionIds.length > 1) return false;

    const vote: Vote = {
      userId,
      username,
      votedAt: Date.now(),
    };

    for (const optionId of optionIds) {
      const option = poll.options.find((o) => o.id === optionId);
      if (!option) return false;
      option.voters.push(vote);
    }

    poll.userVote = optionIds;
    return true;
  }

  getResults(pollId: string): PollResult[] {
    const poll = this.polls.get(pollId);
    if (!poll) return [];

    const totalVotes = poll.options.reduce((sum, o) => sum + o.voters.length, 0);

    return poll.options.map((option, i) => ({
      optionId: option.id,
      text: option.text,
      voteCount: option.voters.length,
      percentage: totalVotes > 0 ? (option.voters.length / totalVotes) * 100 : 0,
      color: POLL_COLORS[i % POLL_COLORS.length],
      voters: [...option.voters],
    }));
  }

  hasUserVoted(pollId: string): boolean {
    const poll = this.polls.get(pollId);
    return poll?.userVote !== undefined;
  }

  getTotalVotes(pollId: string): number {
    const poll = this.polls.get(pollId);
    if (!poll) return 0;
    return poll.options.reduce((sum, o) => sum + o.voters.length, 0);
  }
}

export const pollStore = new PollStore();
