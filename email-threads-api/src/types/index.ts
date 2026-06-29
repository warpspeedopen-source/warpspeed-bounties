export interface ThreadSummary {
  id: string;
  subject: string | null;
  snippet: string | null;
  lastMessageAt: Date;
  messageCount: number;
  isArchived: boolean;
  participants: string[];
  unreadCount: number;
}

export interface ThreadDetail extends ThreadSummary {
  messages: MessageSummary[];
}

export interface MessageSummary {
  id: string;
  subject: string | null;
  snippet: string | null;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  messageType: 'INBOUND' | 'OUTBOUND' | 'DRAFT';
  createdAt: Date;
}

export interface DraftUpdate {
  threadId: string;
  body: string;
  subject?: string;
  toAddresses?: string[];
  ccAddresses?: string[];
}

export interface ThreadListOptions {
  page?: number;
  limit?: number;
  search?: string;
  isArchived?: boolean;
  includeDeleted?: boolean;
}

export interface ThreadListResult {
  threads: ThreadSummary[];
  total: number;
  page: number;
  limit: number;
}
