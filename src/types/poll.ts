export interface PollOption {
  id: string;
  text: string;
  votedUsers: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  createdBy: string;
  createdAt: number;
  totalParticipants?: number;
}
