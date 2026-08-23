import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

describe('Email Threads API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    userId = 'test-user-id';
    token = 'mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { userId } });
    await prisma.thread.deleteMany({ where: { userId } });
    await prisma.$disconnect();
  });

  it('should list threads for authenticated user', async () => {
    const res = await request(app)
      .get('/api/threads')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should create a draft in a new thread', async () => {
    const res = await request(app)
      .post('/api/threads/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Test Subject', body: 'Test Body' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.isDraft).toBe(true);
  });

  it('should update thread recency when draft is updated', async () => {
    const draftRes = await request(app)
      .post('/api/threads/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'Update Test', body: 'Test' });

    const threadId = draftRes.body.threadId;
    const messageId = draftRes.body.id;

    const initialThread = await prisma.thread.findUnique({ where: { id: threadId } });
    
    await new Promise(r => setTimeout(r, 100));

    await request(app)
      .put(`/api/threads/drafts/${messageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Updated Body' });

    const updatedThread = await prisma.thread.findUnique({ where: { id: threadId } });
    expect(updatedThread!.lastMessageAt.getTime()).toBeGreaterThan(initialThread!.lastMessageAt.getTime());
  });

  it('should exclude archived and deleted messages from thread', async () => {
    const thread = await prisma.thread.create({
      data: {
        userId,
        subject: 'Archive Test',
        lastMessageAt: new Date(),
      },
    });

    await prisma.message.create({
      data: {
        threadId: thread.id,
        userId,
        from: 'test@test.com',
        to: ['user@test.com'],
        subject: 'Archive Test',
        body: 'Archived',
        isArchived: true,
        sentAt: new Date(),
      },
    });

    const res = await request(app)
      .get(`/api/threads/${thread.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.messages.length).toBe(0);
  });
});