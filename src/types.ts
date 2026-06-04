import { z } from 'zod';

/**
 * Auth context extracted from the trusted app session.
 * In production this comes from the warpSpeed auth middleware (JWT/session).
 * Tests inject it via the test helper.
 */
export interface AuthContext {
  userId: string;
  email: string;
}

/**
 * Query parameters for listing threads.
 */
export const ListThreadsQuerySchema = z.object({
  search: z.string().optional(),
  folder: z.enum(['inbox', 'drafts', 'archived', 'deleted', 'all']).optional().default('inbox'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListThreadsQuery = z.infer<typeof ListThreadsQuerySchema>;

/**
 * Request body for creating a draft.
 */
export const CreateDraftSchema = z.object({
  body: z.string().min(1, 'Body is required'),
  subject: z.string().optional(),
});

export type CreateDraftBody = z.infer<typeof CreateDraftSchema>;

export interface ThreadSummary {
  id: string;
  subject: string;
  lastActivity: string;
  isArchived: boolean;
  isDeleted: boolean;
  messageCount: number;
  latestMessage?: MessageSummary;
}

/**
 * Thread detail response shape.
 */
export interface ThreadResponse {
  id: string;
  subject: string;
  lastActivity: string;
  isArchived: boolean;
  isDeleted: boolean;
  messageCount: number;
  latestMessage?: MessageSummary;
  messages: MessageResponse[];
}


export interface MessageSummary {
  id: string;
  body: string;
  senderId: string;
  isDraft: boolean;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  subject: string;
  isDraft: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isRead: boolean;
  providerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Provider message types for sync (Gmail/Outlook/IMAP).
 */
export type EmailProvider = 'gmail' | 'outlook' | 'imap';

export interface ProviderMessage {
  providerId: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName?: string;
  receivedAt: string;
  provider: EmailProvider;
  inReplyTo?: string;        // References parent message for threading
  references?: string;       // Message-ID references header
  threadId?: string;         // Provider's thread/conversation ID
}

/**
 * Error response shape.
 */
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
