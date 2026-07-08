import express from 'express';
import ThreadController from '../controllers/thread.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Email Threads
 *   description: Threaded email conversation management
 */

/**
 * @swagger
 * /threads:
 *   get:
 *     summary: List email threads for the authenticated user
 *     tags: [Email Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in subject or message content
 *     responses:
 *       200:
 *         description: List of email threads
 */
router.get('/', authenticateUser, ThreadController.listThreads);

/**
 * @swagger
 * /threads/{threadId}:
 *   get:
 *     summary: Get a single email thread with all related messages
 *     tags: [Email Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Email thread with messages
 */
router.get('/:threadId', authenticateUser, ThreadController.getThread);

export default router;