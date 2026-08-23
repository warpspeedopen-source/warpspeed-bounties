import { Router } from 'express';
import { ThreadsController } from '../controllers/threads.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const threadsController = new ThreadsController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/threads:
 *   get:
 *     summary: List email threads
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of threads
 */
router.get('/', threadsController.list.bind(threadsController));

/**
 * @swagger
 * /api/threads/{threadId}:
 *   get:
 *     summary: Get thread details
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thread details
 */
router.get('/:threadId', threadsController.get.bind(threadsController));

/**
 * @swagger
 * /api/threads/drafts:
 *   post:
 *     summary: Create a new draft
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Draft created
 */
router.post('/drafts', threadsController.createDraft.bind(threadsController));

/**
 * @swagger
 * /api/threads/drafts/{messageId}:
 *   put:
 *     summary: Update a draft
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Draft updated
 */
router.put('/drafts/:messageId', threadsController.updateDraft.bind(threadsController));

/**
 * @swagger
 * /api/threads/drafts/{messageId}/send:
 *   post:
 *     summary: Send a draft
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Draft sent
 */
router.post('/drafts/:messageId/send', threadsController.sendDraft.bind(threadsController));

export default router;