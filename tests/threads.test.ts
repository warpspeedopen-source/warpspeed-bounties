import request from 'supertest';
import { app } from '../src/index';

// Mocking Prisma Client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    thread: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
    }
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('Threads API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/threads', () => {
    it('should require x-user-id header', async () => {
      const res = await request(app).get('/api/threads');
      expect(res.status).toBe(401);
    });

    it('should return a list of threads', async () => {
      const mockThreads = [{ id: '1', subject: 'Test Thread', messages: [] }];
      (prisma.thread.findMany as jest.Mock).mockResolvedValue(mockThreads);

      const res = await request(app)
        .get('/api/threads')
        .set('x-user-id', 'user123');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockThreads);
      expect(prisma.thread.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ ownerId: 'user123' })
      }));
    });
  });

  describe('GET /api/threads/:id', () => {
    it('should return a specific thread with messages', async () => {
      const mockThread = { id: 'thread1', subject: 'Test Thread', messages: [{ id: 'msg1' }] };
      (prisma.thread.findFirst as jest.Mock).mockResolvedValue(mockThread);

      const res = await request(app)
        .get('/api/threads/thread1')
        .set('x-user-id', 'user123');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockThread);
    });

    it('should return 404 if thread not found', async () => {
      (prisma.thread.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/threads/thread1')
        .set('x-user-id', 'user123');
      
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/threads/:id/drafts', () => {
    it('should create a draft and update thread lastActivity', async () => {
      const mockThread = { id: 'thread1', ownerId: 'user123' };
      (prisma.thread.findFirst as jest.Mock).mockResolvedValue(mockThread);
      
      const mockMessage = { id: 'draft1', threadId: 'thread1', body: 'draft body', isDraft: true };
      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const res = await request(app)
        .post('/api/threads/thread1/drafts')
        .set('x-user-id', 'user123')
        .send({ body: 'draft body' });
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockMessage);
      expect(prisma.thread.update).toHaveBeenCalled();
    });
  });
});
