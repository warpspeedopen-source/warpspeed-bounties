export interface Voter {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: Voter[]; // List of voters who selected this option
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
  createdAt: string;
  creator: Voter;
  totalUniqueVoters?: number;
}
