export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleChoices: boolean;
  creatorId: string;
  totalGroupParticipants: number;
  createdAt: string;
}
