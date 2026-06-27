// Types for Messenger Poll feature

export type VoteType = 'single' | 'multiple';

export interface PollOption {
  id: string;
  text: string;
  voters: string[]; // user IDs
  createdAt: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  voteType: VoteType;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  totalParticipants: number; // total group members who can vote
}

export interface PollCreationData {
  question: string;
  options: string[];
  voteType: VoteType;
}

export interface VoterProfile {
  id: string;
  name: string;
  avatar?: string;
}

export const MAX_POLL_OPTIONS = 12;
export const MAX_QUESTION_LENGTH = 255;

// Helper functions
export function calculatePercentage(votes: number, totalVoters: number): number {
  if (totalVoters === 0) return 0;
  return Math.round((votes / totalVoters) * 100);
}
