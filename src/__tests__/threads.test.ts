import request from 'supertest';
import { app } from '../index';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockFindMany = jest.fn();
  const mockFindFirst = jest.fn();
  const mockCount = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      thread: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
        count: mockCount,
        create: mockCreate,
        update: mockUpdate,
      },
      message: {
        findFirst: mockFindFirst,
        create: mockCreate,
        update: mockUpdate,
      },
      $disconnect: jest.fn(),
    })),
    Prisma: {
      ModelName: {},
    },
  };
});

// Import the mocked PrismaClient
import { PrismaClient } from '@prisma/client';

// Helper to get the mock instance
function getPrismaMock() {
  const prisma = new PrismaClient() as any;
  return {
    threadFindMany: prisma.thread.findMany,
    threadFindFirst: prisma.thread.findFirst,
    threadCount: prisma.thread.count,
    threadCreate: prisma.thread.create,
    threadUpdate: prisma.thread.update,
    messageFindFirst: prisma.message.findFirst,
    messageCreate: prisma.message.create,
    messageUpdate: prisma.message.update,
  };
}

describe('Email Threads API', () => {
  const AUTH_HEADERS = { 'x-user-id': 'user-123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================
  // AUTH
  // ===========================
  describe('Authentication', () => {
    it('should return 401 when x-user-id is missing', async () => {
      const res = await request(app).get('/api/threads');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when x-user-id is empty', async () => {
      const res = await request(app).get('/api/threads').set('x-user-id', '');
      expect(res.status).toBe(401);
    });
  });

  // ===========================
  // LIST THREADS
  // ===========================
  describe('GET /api/threads', () => {
    it('should return paginated threads', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindMany.mockResolvedValue([
        {
          id: 'thread-1',
          subject: 'Project Update',
          lastActivity: new Date('2026-05-30T10:00:00Z'),
          isArchived: false,
          isDeleted: false,
          messages: [
            { id: 'msg-1', body: 'Latest update', senderId: 'user-123', isDraft: false, createdAt: new Date('2026-05-30T10:00:00Z') },
          ],
          _count: { messages: 5 },
        },
      ]);
      mocks.threadCount.mockResolvedValue(1);

      const res = await request(app).get('/api/threads').set(AUTH_HEADERS);
      expect(res.status).toBe(200);
      expect(res.body.threads).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.threads[0].subject).toBe('Project Update');
      expect(res.body.threads[0].messageCount).toBe(5);
      expect(res.body.threads[0].latestMessage).toBeDefined();
    });

    it('should filter by folder=archived', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindMany.mockResolvedValue([]);
      mocks.threadCount.mockResolvedValue(0);

      await request(app).get('/api/threads').query({ folder: 'archived' }).set(AUTH_HEADERS);

      expect(mocks.threadFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isArchived: true, isDeleted: false }),
        })
      );
    });

    it('should filter by folder=drafts', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindMany.mockResolvedValue([]);
      mocks.threadCount.mockResolvedValue(0);

      await request(app).get('/api/threads').query({ folder: 'drafts' }).set(AUTH_HEADERS);

      expect(mocks.threadFindMany).toHaveBeenCalled();
    });

    it('should search across subject and body', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindMany.mockResolvedValue([]);
      mocks.threadCount.mockResolvedValue(0);

      await request(app).get('/api/threads').query({ search: 'invoice' }).set(AUTH_HEADERS);

      const callWhere = mocks.threadFindMany.mock.calls[0][0].where;
      expect(callWhere.AND).toBeDefined();
    });

    it('should paginate correctly', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindMany.mockResolvedValue([]);
      mocks.threadCount.mockResolvedValue(0);

      await request(app).get('/api/threads').query({ page: '2', limit: '10' }).set(AUTH_HEADERS);

      expect(mocks.threadFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });

    it('should reject invalid query params', async () => {
      const res = await request(app)
        .get('/api/threads')
        .query({ limit: '999' })
        .set(AUTH_HEADERS);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================
  // GET THREAD
  // ===========================
  describe('GET /api/threads/:id', () => {
    it('should return thread with messages', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue({
        id: 'thread-1',
        subject: 'Meeting Notes',
        lastActivity: new Date('2026-05-30T10:00:00Z'),
        isArchived: false,
        isDeleted: false,
        messages: [
          { id: 'msg-1', threadId: 'thread-1', senderId: 'user-123', body: 'First message', subject: '', isDraft: false, isArchived: false, isDeleted: false, isRead: true, createdAt: new Date('2026-05-29T10:00:00Z'), updatedAt: new Date('2026-05-29T10:00:00Z') },
          { id: 'msg-2', threadId: 'thread-1', senderId: 'user-123', body: 'Reply', subject: '', isDraft: false, isArchived: false, isDeleted: false, isRead: false, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:00:00Z') },
        ],
      });

      const res = await request(app).get('/api/threads/thread-1').set(AUTH_HEADERS);
      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].body).toBe('First message');
    });

    it('should return 404 for non-existent thread', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue(null);

      const res = await request(app).get('/api/threads/ghost').set(AUTH_HEADERS);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should not return thread owned by another user', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue(null);

      const res = await request(app).get('/api/threads/thread-other').set({ 'x-user-id': 'user-456' });
      expect(res.status).toBe(404);
    });

    it('should sort messages by createdAt ascending', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue({
        id: 'thread-1',
        subject: 'Sorted',
        lastActivity: new Date(),
        isArchived: false,
        isDeleted: false,
        messages: [],
      });

      await request(app).get('/api/threads/thread-1').set(AUTH_HEADERS);

      expect(mocks.threadFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            messages: expect.objectContaining({
              orderBy: { createdAt: 'asc' },
            }),
          }),
        })
      );
    });
  });

  // ===========================
  // DRAFTS
  // ===========================
  describe('POST /api/threads/:id/drafts', () => {
    it('should create a draft and update recency', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue({ id: 'thread-1', ownerId: 'user-123' });
      mocks.messageCreate.mockResolvedValue({
        id: 'draft-1',
        threadId: 'thread-1',
        senderId: 'user-123',
        body: 'Draft content',
        subject: '',
        isDraft: true,
        isArchived: false,
        isDeleted: false,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/threads/thread-1/drafts')
        .set(AUTH_HEADERS)
        .send({ body: 'Draft content' });

      expect(res.status).toBe(201);
      expect(res.body.isDraft).toBe(true);
      expect(mocks.threadUpdate).toHaveBeenCalled(); // recency update
    });

    it('should return 404 when thread does not exist', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/threads/ghost/drafts')
        .set(AUTH_HEADERS)
        .send({ body: 'Draft' });

      expect(res.status).toBe(404);
    });

    it('should reject empty body', async () => {
      const res = await request(app)
        .post('/api/threads/thread-1/drafts')
        .set(AUTH_HEADERS)
        .send({ body: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================
  // SEND DRAFT
  // ===========================
  describe('POST /api/threads/:id/drafts/:draftId/send', () => {
    it('should convert draft to sent message', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue({ id: 'thread-1', ownerId: 'user-123' });
      mocks.messageUpdate.mockResolvedValue({
        id: 'draft-1',
        threadId: 'thread-1',
        senderId: 'user-123',
        body: 'Sending now',
        subject: '',
        isDraft: false,
        isArchived: false,
        isDeleted: false,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/threads/thread-1/drafts/draft-1/send')
        .set(AUTH_HEADERS);

      expect(res.status).toBe(200);
      expect(res.body.isDraft).toBe(false);
      expect(mocks.threadUpdate).toHaveBeenCalled();
    });
  });

  // ===========================
  // PROVIDER SYNC
  // ===========================
  describe('POST /api/threads/provider/sync', () => {
    it('should import a Gmail message and create thread', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValue(null); // No matching thread
      mocks.threadCreate.mockResolvedValue({
        id: 'new-thread',
        subject: 'Hello from Gmail',
        lastActivity: new Date('2026-05-30T10:00:00Z'),
        ownerId: 'user-123',
        isArchived: false,
        isDeleted: false,
      });
      mocks.messageCreate.mockResolvedValue({
        id: 'msg-provider-1',
        threadId: 'new-thread',
        senderId: 'user-123',
        body: 'Gmail body',
        subject: 'Hello from Gmail',
        isDraft: false,
        isArchived: false,
        isDeleted: false,
        isRead: false,
        providerId: 'gmail-msg-001',
        createdAt: new Date('2026-05-30T10:00:00Z'),
        updatedAt: new Date('2026-05-30T10:00:00Z'),
      });

      const res = await request(app)
        .post('/api/threads/provider/sync')
        .set(AUTH_HEADERS)
        .send({
          providerId: 'gmail-msg-001',
          subject: 'Hello from Gmail',
          body: 'Gmail body',
          senderEmail: 'friend@gmail.com',
          receivedAt: '2026-05-30T10:00:00Z',
          provider: 'gmail',
        });

      expect(res.status).toBe(201);
      expect(res.body.providerId).toBe('gmail-msg-001');
    });

    it('should deduplicate by providerId', async () => {
      const mocks = getPrismaMock();
      // First call: findFirst for existing providerId -> found
      mocks.messageFindFirst = mocks.threadFindFirst; // reuse
      mocks.threadFindFirst.mockResolvedValueOnce({ id: 'existing-thread' }); // thread exists
      mocks.threadFindFirst.mockResolvedValueOnce({
        id: 'existing-msg',
        threadId: 'existing-thread',
        senderId: 'user-123',
        body: 'Already synced',
        subject: '',
        isDraft: false,
        isArchived: false,
        isDeleted: false,
        isRead: false,
        providerId: 'gmail-msg-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/threads/provider/sync')
        .set(AUTH_HEADERS)
        .send({
          providerId: 'gmail-msg-001',
          subject: 'Hello',
          body: 'Already synced',
          senderEmail: 'friend@gmail.com',
          receivedAt: '2026-05-30T10:00:00Z',
          provider: 'gmail',
        });

      expect(res.status).toBe(201);
      expect(mocks.messageCreate).not.toHaveBeenCalled();
    });

    it('should handle out-of-order provider messages', async () => {
      const mocks = getPrismaMock();
      mocks.threadFindFirst.mockResolvedValueOnce({ id: 'thread-old', lastActivity: new Date('2026-05-20T10:00:00Z'), ownerId: 'user-123' }); // thread with earlier activity
      mocks.threadFindFirst.mockResolvedValueOnce(null); // No duplicate message
      mocks.threadCreate = jest.fn(); // not called
      mocks.messageCreate.mockResolvedValue({
        id: 'late-msg',
        threadId: 'thread-old',
        senderId: 'user-123',
        body: 'Late arrival',
        subject: 'Re: old thread',
        isDraft: false,
        isArchived: false,
        isDeleted: false,
        isRead: false,
        providerId: 'late-001',
        createdAt: new Date('2026-05-25T10:00:00Z'),
        updatedAt: new Date('2026-05-25T10:00:00Z'),
      });
      mocks.threadUpdate.mockResolvedValue({});

      await request(app)
        .post('/api/threads/provider/sync')
        .set(AUTH_HEADERS)
        .send({
          providerId: 'late-001',
          subject: 'Re: old thread',
          body: 'Late arrival',
          senderEmail: 'someone@gmail.com',
          receivedAt: '2026-05-25T10:00:00Z',
          provider: 'gmail',
        });

      // Should update thread recency because the message is newer than current
      expect(mocks.threadUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'thread-old' },
          data: expect.objectContaining({
            lastActivity: expect.any(Date),
          }),
        })
      );
    });
  });

  // ===========================
  // SWAGGER DOCS
  // ===========================
  describe('GET /api-docs', () => {
    it('should serve Swagger UI', async () => {
      const res = await request(app).get('/api-docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger');
    });
  });
});
