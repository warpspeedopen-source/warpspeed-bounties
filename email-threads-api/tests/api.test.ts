import request from 'supertest';
import app from '../src/app';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    thread: {
      findMany: jest.fn().mockResolvedValue([
        { id: 't1', subject: 'Test Thread', userId: 'user-1', updatedAt: new Date(), messages: [] }
      ]),
      findUnique: jest.fn().mockResolvedValue(
        { id: 't1', subject: 'Test Thread', userId: 'user-1', messages: [] }
      ),
      update: jest.fn().mockResolvedValue({}),
    },
    message: {
      create: jest.fn().mockResolvedValue({ id: 'm1', body: 'draft', isDraft: true }),
    },
    $transaction: jest.fn().mockImplementation((args) => Promise.all(args)),
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Email Threads API', () => {
  it('should list threads', async () => {
    const res = await request(app).get('/api/threads').set('x-user-id', 'user-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('should get a single thread', async () => {
    const res = await request(app).get('/api/threads/t1').set('x-user-id', 'user-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('t1');
  });

  it('should add a draft and update thread recency', async () => {
    const res = await request(app)
      .post('/api/threads/t1/drafts')
      .set('x-user-id', 'user-1')
      .send({ body: 'draft body' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.threadStatus).toBe('updated');
  });
});
