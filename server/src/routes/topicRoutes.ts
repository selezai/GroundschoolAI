import express from 'express';
import {
  generateTopic,
  getTopics,
  getTopicById,
  getRelatedTopics,
  updateTopic,
  deleteTopic,
} from '../controllers/topicController';

const router = express.Router();

// Topic routes
router.post('/generate', generateTopic);
router.get('/', getTopics);
router.get('/:id', getTopicById);
router.get('/:id/related', getRelatedTopics);
router.patch('/:id', updateTopic);
router.delete('/:id', deleteTopic);

export default router;
