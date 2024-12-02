import express from 'express';
import { syncController } from '../controllers/syncController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Start a new sync operation
router.post('/start', syncController.startSync);

// Update sync status
router.put('/:syncId', syncController.updateSync);

// Get sync history for a user
router.get('/history/:userId', syncController.getSyncHistory);

export default router;
