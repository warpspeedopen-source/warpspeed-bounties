# Email Threads API - Tests

## Thread List

### GET /api/threads
Returns paginated list of email threads.

Query Parameters:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `category` (string: INBOX|SENT|DRAFT|SPAM|TRASH|ARCHIVE) - Filter by category
- `priority` (string: LOW|NORMAL|HIGH|URGENT) - Filter by priority
- `isRead` (boolean) - Filter by read status
- `isStarred` (boolean) - Filter by starred status
- `search` (string) - Search in subject, snippet, and message body
- `label` (string) - Filter by label name
- `tag` (string) - Filter by tag name
- `sortBy` (string: createdAt|updatedAt|subject, default: createdAt)
- `sortOrder` (string: asc|desc, default: desc)

### Response
```json
{
  "threads": [
    {
      "id": "clx...",
      "subject": "Meeting tomorrow",
      "snippet": "Hi, just confirming our meeting...",
      "isRead": false,
      "isStarred": true,
      "category": "INBOX",
      "priority": "HIGH",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:00:00Z",
      "messageCount": 3,
      "lastMessageFrom": "Alice",
      "labels": [{ "id": "...", "name": "Work", "color": "#007AFF" }],
      "tags": [{ "id": "...", "name": "Important", "color": "#FF3B30" }]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

## Thread Detail

### GET /api/threads/:id
Returns a single thread with all its messages.

### Response
```json
{
  "id": "clx...",
  "subject": "Meeting tomorrow",
  "snippet": "Hi, just confirming our meeting...",
  "isRead": false,
  "isStarred": true,
  "category": "INBOX",
  "priority": "HIGH",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z",
  "messages": [
    {
      "id": "...",
      "fromName": "Alice",
      "fromEmail": "alice@example.com",
      "to": "bob@example.com",
      "cc": null,
      "subject": "Meeting tomorrow",
      "body": "Hi, just confirming our meeting...",
      "isRead": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "labels": [...],
  "tags": [...]
}
```
