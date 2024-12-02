import { Request, Response } from 'express';
import { z } from 'zod';
import TopicService from '../services/topicService';
import { NotFoundError, ValidationError } from '../utils/errors';

const topicService = new TopicService(process.env.OPENAI_API_KEY || '');

// Validation schemas
const generateTopicSchema = z.object({
  category: z.string().min(1),
});

const getTopicsSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(50).optional(),
  skip: z.number().min(0).optional(),
});

const updateTopicSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.array(z.string()).optional(),
});

export const generateTopic = async (req: Request, res: Response) => {
  try {
    const { category } = generateTopicSchema.parse(req.body);
    const topic = await topicService.generateTopic(category);
    res.status(201).json(topic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to generate topic' });
    }
  }
};

export const getTopics = async (req: Request, res: Response) => {
  try {
    const query = getTopicsSchema.parse({
      ...req.query,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
    });

    const topics = await topicService.getTopics(query);
    res.json(topics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const topic = await topicService.getTopicById(req.params.id);
    if (!topic) {
      throw new NotFoundError('Topic not found');
    }
    res.json(topic);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch topic' });
    }
  }
};

export const getRelatedTopics = async (req: Request, res: Response) => {
  try {
    const topics = await topicService.findRelatedTopics(req.params.id);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch related topics' });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const updates = updateTopicSchema.parse(req.body);
    const topic = await topicService.updateTopic(req.params.id, updates);
    if (!topic) {
      throw new NotFoundError('Topic not found');
    }
    res.json(topic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid update data', details: error.errors });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update topic' });
    }
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const success = await topicService.deleteTopic(req.params.id);
    if (!success) {
      throw new NotFoundError('Topic not found');
    }
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete topic' });
    }
  }
};
