export interface EmailThread {
  id: string;
  userId: string;
  subject: string;
  snippet: string;
  lastMessageDate: Date;
  messageCount: number;
  participants: string[];
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailThreadMessage {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  date: Date;
  isDraft: boolean;
  isSent: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  messageId: string;
  userId: string;
  accountId: string;
}

export interface EmailAccount {
  id: string;
  userId: string;
  provider: string;
  emailAddress: string;
  name: string;
  label: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSync: Date;
  isActive: boolean;
}

export interface EmailThreadFilter {
  userId?: string;
  hasAttachment?: boolean;
  isStarred?: boolean;
  isDraft?: boolean;
  isSent?: boolean;
  search?: string;
  sort?: 'date' | 'from' | 'to' | 'subject';
  order?: 'asc' | 'desc';
}