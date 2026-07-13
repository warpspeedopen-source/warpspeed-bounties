// ──────────────────────────────────────────────
// Core domain models
// ──────────────────────────────────────────────

export interface ThreadParticipant {
  name: string
  email: string
  role: 'from' | 'to' | 'cc' | 'bcc'
}

export interface Attachment {
  id: string
  filename: string
  mimeType: string
  size: number
  url: string
}

export type BodyType = 'plain' | 'html'

export interface EmailMessage {
  id: string
  threadId: string
  from: ThreadParticipant
  to: ThreadParticipant[]
  cc: ThreadParticipant[]
  bcc: ThreadParticipant[]
  subject: string
  body: string
  bodyType: BodyType
  sentAt: string
  receivedAt: string
  attachments: Attachment[]
}

export type ThreadCategory = 'inbox' | 'sent' | 'drafts' | 'archived' | 'spam' | 'trash'

export interface EmailThread {
  id: string
  subject: string
  participants: ThreadParticipant[]
  lastMessageAt: string
  createdAt: string
  messageCount: number
  snippet: string
  category: ThreadCategory
  isStarred: boolean
  isRead: boolean
  labels: string[]
}

// ──────────────────────────────────────────────
// API request / response types
// ──────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: 'lastMessageAt' | 'createdAt' | 'subject'
  order?: 'asc' | 'desc'
}

export interface ThreadFilterParams {
  q?: string
  category?: ThreadCategory
  read?: boolean
  starred?: boolean
  from?: string
  label?: string
  before?: string
  after?: string
}

export type ListThreadsParams = PaginationParams & ThreadFilterParams

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ThreadDetailResponse {
  data: {
    thread: EmailThread
    messages: EmailMessage[]
  }
}

export interface ReplyRequest {
  body: string
  bodyType: BodyType
  to: ThreadParticipant[]
  cc?: ThreadParticipant[]
  bcc?: ThreadParticipant[]
  attachments?: AttachmentPayload[]
}

export interface CreateThreadRequest {
  subject: string
  body: string
  bodyType: BodyType
  to: ThreadParticipant[]
  cc?: ThreadParticipant[]
  bcc?: ThreadParticipant[]
  attachments?: AttachmentPayload[]
}

export interface SentMessageResponse {
  data: {
    message: EmailMessage
    thread: EmailThread
  }
}

export interface AttachmentPayload {
  filename: string
  mimeType: string
  size: number
  content: string
}

export interface ApiError {
  error: string
  message: string
  details?: ValidationDetail[]
}

export interface ValidationDetail {
  field: string
  code: string
  message: string
}
