import express from 'express';
import { aiController } from '../controllers/aiController';

const router = express.Router();

// Generate questions from content
router.post('/questions', aiController.generateQuestions);

// Get explanation for a concept
router.post('/explain', aiController.explainConcept);

// Generate personalized study plan
router.post('/study-plan', aiController.generateStudyPlan);

// Analyze quiz performance
router.post('/analyze', aiController.analyzePerformance);

export default router;
