import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  listEmailThreads, 
  getEmailThread, 
  searchEmailThreads 
} from '../controllers/emailThreads.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Email Threads
 *   description: Threaded email API endpoints
 */

/**
 * @swagger
 * /api/v1/email/threads:
 *   get:
 *     summary: List email threads for the authenticated user
 *     tags: [Email Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
         name: limit
         schema:
           type: integer
           default: 20
       - in: query
         name: offset
         schema:
           type: integer
           default: 0
       - in: query
         name: include_archived
         schema:
           type: boolean
           default: false
       - in: query
         name: include_deleted
         schema:
           type: boolean
           default: false
     responses:
       '200':
         description: List of email threads
       '401':
         description: Unauthorized
 */
router.get('/api/v1/email/threads', 
  authenticateToken, 
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer'),
    query('include_archived').optional().isBoolean(),
    query('include_deleted').optional().isBoolean()
  ],
  listEmailThreads
);

/**
 * @swagger
 * /api/v1/email/threads/{threadId}:
 *   get:
 *     summary: Get a specific email thread with all related messages
 *     tags: [Email Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Email thread with related messages
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Thread not found
 */
router.get('/api/v1/email/threads/:threadId', 
  authenticateToken, 
  param('threadId').isString().withMessage('Thread ID is required'),
  getEmailThread
);

/**
 * @swagger
 * /api/v1/email/threads/search:
 *   get:
 *     summary: Search email threads with filtering and grouping
 *     tags: [Email Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: include_archived
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: include_deleted
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       '200':
 *         description: Search results grouped by thread
 *       '401':
 *         description: Unauthorized
 */
router.get('/api/v1/email/threads/search', 
  authenticateToken,
  query('q').optional().isString().withMessage('Search query must be a string'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer'),
  query('include_archived').optional().isBoolean(),
  query('include_deleted').optional().isBoolean(),
  searchEmailThreads
);

export default router;