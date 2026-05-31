/**
 * Messenger Group Chat Poll - Type Definitions
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

export interface PollVoter {
  userId: string;
  displayName: string;
  avatarUri?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voters: PollVoter[];
}

export type PollVoteMode = "single" | "multiple";

export type PollStatus = "active" | "closed";

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  voteMode: PollVoteMode;
  status: PollStatus;
  createdBy: PollVoter;
  createdAt: Date;
  totalParticipants: number;
}

export interface PollCreateInput {
  question: string;
  options: string[];
  voteMode: PollVoteMode;
}

export interface PollVoteInput {
  pollId: string;
  optionIds: string[];
  voter: PollVoter;
}

export interface PollOptionResult {
  option: PollOption;
  voteCount: number;
  percentage: number;
  isSelected: boolean;
  voters: PollVoter[];
}

export interface PollResults {
  poll: Poll;
  optionResults: PollOptionResult[];
  totalVotes: number;
  hasVoted: boolean;
  selectedOptionIds: string[];
}

export type VoteSheetTab = "all" | string;
