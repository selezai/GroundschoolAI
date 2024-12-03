import Anthropic from '@anthropic-ai/sdk';
import Topic, { ITopic } from '../models/Topic';
import { TopicGenerationError } from '../utils/errors';

export class TopicService {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey
    });
  }

  async generateTopic(category: string): Promise<ITopic> {
    try {
      const prompt = `
        Generate a comprehensive aviation topic for the category: ${category}
        
        The topic should include:
        1. A clear title
        2. A brief description
        3. Detailed content covering key points
        4. Appropriate difficulty level (beginner, intermediate, or advanced)
        5. Relevant tags
        
        Format the response as a JSON object with the following structure:
        {
          "title": "string",
          "description": "string",
          "content": "string",
          "difficulty": "beginner|intermediate|advanced",
          "tags": ["string"]
        }
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const generatedContent = JSON.parse(response.content[0].text || '{}');

      const topic = new Topic({
        ...generatedContent,
        category,
        lastUpdated: new Date(),
      });

      await topic.save();
      return topic;
    } catch (error: any) {
      throw new TopicGenerationError(
        `Failed to generate topic for category ${category}: ${error.message}`
      );
    }
  }

  async getTopics(options: {
    category?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<ITopic[]> {
    const { category, difficulty, search, limit = 10, skip = 0 } = options;
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$text = { $search: search };
    }

    return Topic.find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedTopics', 'title category');
  }

  async getTopicById(id: string): Promise<ITopic | null> {
    return Topic.findById(id).populate('relatedTopics', 'title category');
  }

  async findRelatedTopics(topicId: string): Promise<ITopic[]> {
    const topic = await Topic.findById(topicId);
    if (!topic) return [];

    return Topic.find({
      $and: [
        { _id: { $ne: topicId } },
        {
          $or: [
            { category: topic.category },
            { tags: { $in: topic.tags } },
          ],
        },
      ],
    })
      .limit(5)
      .select('title category description');
  }

  async updateTopic(id: string, updates: Partial<ITopic>): Promise<ITopic | null> {
    return Topic.findByIdAndUpdate(
      id,
      { ...updates, lastUpdated: new Date() },
      { new: true }
    ).populate('relatedTopics', 'title category');
  }

  async deleteTopic(id: string): Promise<boolean> {
    const result = await Topic.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}

// Create and export a singleton instance
export const topicService = new TopicService(process.env.ANTHROPIC_API_KEY || '');
