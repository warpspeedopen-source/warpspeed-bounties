export interface EmailThreadListResponse {
  threads: EmailThread[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailThreadDetailResponse {
  thread: EmailThread;
  messages: EmailMessage[];
}

export interface EmailThreadQueryParams {
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'unread' | 'starred';
  filterBy?: 'all' | 'unread' | 'starred' | 'inbox';
}

export interface EmailThreadCreateRequest {
  subject: string;
  messageIds: string[];
  participants: Array<{ email: string; name?: string }>;
}