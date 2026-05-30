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

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleChoice: boolean;
  createdAt: string;
  createdBy: PollVoter;
  totalGroupMembers: number;
  isClosed: boolean;
}

export interface CreatePollInput {
  question: string;
  optionTexts: string[];
  allowMultipleChoice: boolean;
}
