import { Request, Response } from 'express';
import { Database } from '../types/database';
import { topicService } from '../services/topicService';

type Topic = Database['public']['Tables']['topics']['Row'];
type TopicInsert = Database['public']['Tables']['topics']['Insert'];
type TopicUpdate = Database['public']['Tables']['topics']['Update'];

export class TopicController {
  async getAllTopics(req: Request, res: Response) {
    try {
      const topics = await topicService.getAllTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching topics' });
    }
  }

  async getTopicById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const topic = await topicService.getTopicById(id);
      
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching topic' });
    }
  }

  async createTopic(req: Request, res: Response) {
    try {
      const topicData: TopicInsert = req.body;
      const topic = await topicService.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      res.status(500).json({ error: 'Error creating topic' });
    }
  }

  async updateTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const topicData: TopicUpdate = req.body;
      const topic = await topicService.updateTopic(id, topicData);
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: 'Error updating topic' });
    }
  }

  async deleteTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await topicService.deleteTopic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error deleting topic' });
    }
  }
}
