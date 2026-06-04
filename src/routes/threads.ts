import { Router } from 'express';
import { threadsController } from '../controllers/threadsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List threads with search/filter/pagination
router.get('/', (req, res) => threadsController.listThreads(req, res));

// Get single thread with messages
router.get('/:id', (req, res) => threadsController.getThread(req, res));

// Create draft in a thread
router.post('/:id/drafts', (req, res) => threadsController.createDraft(req, res));

// Send a draft
router.post('/:id/drafts/:draftId/send', (req, res) => threadsController.sendDraft(req, res));

// Import provider message (Gmail/Outlook/IMAP sync)
router.post('/provider/sync', (req, res) => threadsController.importProviderMessage(req, res));

export default router;
