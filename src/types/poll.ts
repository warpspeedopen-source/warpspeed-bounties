export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[]; // List of user IDs who voted for this option
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleChoices: boolean;
  totalGroupParticipants: number;
  creatorId: string;
  createdAt: Date;
}
