import { EmailProvider, MessageStatus } from '@prisma/client';

export interface ThreadListItem {
  id: string;
  subject: string;
  snippet: string;
  participants: string[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt: Date;
  hasDraft: boolean;
}

export interface ThreadDetail {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  messages: MessageDetail[];
}

export interface MessageDetail {
  id: string;
  messageId: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: MessageStatus;
  provider: EmailProvider;
  sentAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
}

export interface ThreadListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: MessageStatus | 'all';
  provider?: EmailProvider | 'all';
  unreadOnly?: boolean;
  hasDraft?: boolean;
  sortBy?: 'lastMessageAt' | 'subject' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ThreadDetailQuery {
  includeMessages?: boolean;
  messageLimit?: number;
}

export interface CreateDraftInput {
  threadId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface UpdateDraftInput {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  bodyHtml?: string;
}

export interface SendDraftInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
}
