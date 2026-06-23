import { Request } from 'express';

export interface ThreadQueryFilters {
  search?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  hasDrafts?: boolean;
  label?: string;
  participantEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'lastMessageAt' | 'createdAt' | 'subject' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ThreadResponse {
  id: string;
  subject: string;
  snippet: string | null;
  participants: string[];
  messageCount: number;
  draftCount: number;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  labels: string[];
  lastMessageAt: Date;
  lastDraftAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageResponse[];
  drafts?: DraftResponse[];
}

export interface MessageResponse {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  bodyPreview: string | null;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments: AttachmentInfo[] | null;
  provider: string;
  sentAt: Date;
  receivedAt: Date;
}

export interface DraftResponse {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentInfo {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateDraftRequest {
  threadId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}

export interface UpdateDraftRequest {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}

export interface SendDraftRequest {
  draftId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
