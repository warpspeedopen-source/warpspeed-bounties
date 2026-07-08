import { Router } from 'express';
import { listThreads, getThread } from '../api/email-threads.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/email-threads
 * @desc List email threads for the authenticated user
 * @access Private
 */
router.get('/email-threads', authenticateToken, listThreads);

/**
 * @route GET /api/vial/email-threads/:threadId
 * @desc Get a single thread with all its messages
 * @access Private
 */
router.get('/email-threads/:threadId', authenticateToken, getThread);

export default router;