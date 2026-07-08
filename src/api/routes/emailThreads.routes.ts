import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { EmailThreadController } from '../controllers/emailThread.controller';
import { 
  listThreadsSchema, 
  getThreadSchema,
  searchThreadsSchema 
} from '../validators/emailThread.validator';

const router = Router();
const controller = new EmailThreadController();

// List email threads for authenticated user
router.get('/', authenticate, validate(listThreadsSchema), controller.listThreads);

// Get single thread with messages
router.get('/:threadId', authenticate, validate(getThreadSchema), controller.getThread);

// Search threads with filters
router.get('/search', authenticate, validate(searchThreadsSchema), controller.searchThreads);

// Update thread (e.g., archive, mark read)
router.patch('/:threadId', authenticate, controller.updateThread);

// Delete thread
router.delete('/:threadId', authenticate, controller.deleteThread);

export default router;