import { Router } from 'express';
import { threadsController } from '../controllers/threadsController';

const router = Router();

router.get('/', threadsController.listThreads);
router.get('/:id', threadsController.getThread);
router.post('/:id/drafts', threadsController.createDraft);

export default router;
