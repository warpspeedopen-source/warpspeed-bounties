import express from 'express';
import { EmailThreadController } from '../controllers/emailThread.controller';
import { param, body, query } from 'express-validator';

const router = express.Router();
const controller = new EmailThreadController();

// Get all email threads for authenticated user
router.get('/threads', 
  controller.listThreads
);

// Get specific email thread with messages
router.get('/threads/:threadId', 
  controller.listThreads
);

// Get all email threads with filters
router.get('/threads', 
  controller.listThreads
);

export default router;

export const emailThreadRoutes = router;