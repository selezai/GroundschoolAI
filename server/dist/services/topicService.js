"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.topicService = exports.TopicService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const Topic_1 = __importDefault(require("../models/Topic"));
const errors_1 = require("../utils/errors");
class TopicService {
    constructor(apiKey) {
        this.anthropic = new sdk_1.default({
            apiKey
        });
    }
    async generateTopic(category) {
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
            const topic = new Topic_1.default({
                ...generatedContent,
                category,
                lastUpdated: new Date(),
            });
            await topic.save();
            return topic;
        }
        catch (error) {
            throw new errors_1.TopicGenerationError(`Failed to generate topic for category ${category}: ${error.message}`);
        }
    }
    async getTopics(options) {
        const { category, difficulty, search, limit = 10, skip = 0 } = options;
        const query = {};
        if (category) {
            query.category = category;
        }
        if (difficulty) {
            query.difficulty = difficulty;
        }
        if (search) {
            query.$text = { $search: search };
        }
        return Topic_1.default.find(query)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(limit)
            .populate('relatedTopics', 'title category');
    }
    async getTopicById(id) {
        return Topic_1.default.findById(id).populate('relatedTopics', 'title category');
    }
    async findRelatedTopics(topicId) {
        const topic = await Topic_1.default.findById(topicId);
        if (!topic)
            return [];
        return Topic_1.default.find({
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
    async updateTopic(id, updates) {
        return Topic_1.default.findByIdAndUpdate(id, { ...updates, lastUpdated: new Date() }, { new: true }).populate('relatedTopics', 'title category');
    }
    async deleteTopic(id) {
        const result = await Topic_1.default.deleteOne({ _id: id });
        return result.deletedCount === 1;
    }
}
exports.TopicService = TopicService;
// Create and export a singleton instance
exports.topicService = new TopicService(process.env.ANTHROPIC_API_KEY || '');
