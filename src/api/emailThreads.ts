import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const threads = await prisma.thread.findMany({
      where: { userId: req.query.userId as string },
      include: { messages: true }
    });

    return res.status(200).json(threads);
  }
}
