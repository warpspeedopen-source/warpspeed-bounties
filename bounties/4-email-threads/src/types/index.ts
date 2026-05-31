export interface EmailMessage {
  id: string;
  threadId: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  timestamp: Date;
  isDraft: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  userId: string;
  provider: 'gmail' | 'outlook' | 'imap';
}

export interface EmailThread {
  id: string;
  subject: string;
  messages: EmailMessage[];
  lastMessageAt: Date;
  messageCount: number;
  userId: string;
  hasDrafts: boolean;
}
