export interface PollOption {
  id: string;
  text: string;
  voters: Vote[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isMultiChoice: boolean;
  createdBy: string;
  createdAt: number;
  userVote?: string[];
}

export interface Vote {
  userId: string;
  username: string;
  avatarUrl?: string;
  votedAt: number;
}

export interface PollResult {
  optionId: string;
  text: string;
  voteCount: number;
  percentage: number;
  color: string;
  voters: Vote[];
}

export interface PollCreationData {
  question: string;
  options: string[];
  isMultiChoice: boolean;
}

export const MAX_OPTIONS = 12;
export const MIN_OPTIONS = 2;
export const OPTION_MAX_LENGTH = 255;
export const QUESTION_MAX_LENGTH = 500;

export const POLL_COLORS = [
  '#4A90D9',
  '#50C878',
  '#F5A623',
  '#E74C3C',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#8E44AD',
  '#16A085',
];
