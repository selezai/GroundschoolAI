import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const aiController = {
  async generateQuestions(req: Request, res: Response) {
    try {
      const { content, numQuestions } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const questions = await aiService.generateQuestions(content, numQuestions);
      res.json({ questions });
    } catch (error) {
      console.error('Error generating questions:', error);
      res.status(500).json({ error: 'Failed to generate questions' });
    }
  },

  async explainConcept(req: Request, res: Response) {
    try {
      const { concept } = req.body;
      if (!concept) {
        return res.status(400).json({ error: 'Concept is required' });
      }

      const explanation = await aiService.explainConcept(concept);
      res.json({ explanation });
    } catch (error) {
      console.error('Error explaining concept:', error);
      res.status(500).json({ error: 'Failed to explain concept' });
    }
  },

  async generateStudyPlan(req: Request, res: Response) {
    try {
      const { topics, timeFrame } = req.body;
      if (!topics || !timeFrame) {
        return res.status(400).json({ error: 'Topics and timeFrame are required' });
      }

      const studyPlan = await aiService.generateStudyPlan(topics, timeFrame);
      res.json({ studyPlan });
    } catch (error) {
      console.error('Error generating study plan:', error);
      res.status(500).json({ error: 'Failed to generate study plan' });
    }
  },

  async analyzePerformance(req: Request, res: Response) {
    try {
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Valid answers array is required' });
      }

      const analysis = await aiService.analyzePerformance(answers);
      res.json({ analysis });
    } catch (error) {
      console.error('Error analyzing performance:', error);
      res.status(500).json({ error: 'Failed to analyze performance' });
    }
  }
};
