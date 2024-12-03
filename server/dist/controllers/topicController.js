"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTopic = exports.updateTopic = exports.getRelatedTopics = exports.getTopicById = exports.getTopics = exports.generateTopic = void 0;
const zod_1 = require("zod");
const topicService_1 = require("../services/topicService");
const errors_1 = require("../utils/errors");
// Validation schemas
const generateTopicSchema = zod_1.z.object({
    category: zod_1.z.string().min(1),
});
const getTopicsSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    search: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(50).optional(),
    skip: zod_1.z.number().min(0).optional(),
});
const updateTopicSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const generateTopic = async (req, res) => {
    try {
        const { category } = generateTopicSchema.parse(req.body);
        const topic = await topicService_1.topicService.generateTopic(category);
        res.status(201).json(topic);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        else {
            res.status(500).json({ error: 'Failed to generate topic' });
        }
    }
};
exports.generateTopic = generateTopic;
const getTopics = async (req, res) => {
    try {
        const query = getTopicsSchema.parse({
            ...req.query,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            skip: req.query.skip ? parseInt(req.query.skip) : undefined,
        });
        const topics = await topicService_1.topicService.getTopics(query);
        res.json(topics);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
        }
        else {
            res.status(500).json({ error: 'Failed to fetch topics' });
        }
    }
};
exports.getTopics = getTopics;
const getTopicById = async (req, res) => {
    try {
        const topic = await topicService_1.topicService.getTopicById(req.params.id);
        if (!topic) {
            throw new errors_1.NotFoundError('Topic not found');
        }
        res.json(topic);
    }
    catch (error) {
        if (error instanceof errors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to fetch topic' });
        }
    }
};
exports.getTopicById = getTopicById;
const getRelatedTopics = async (req, res) => {
    try {
        const topics = await topicService_1.topicService.findRelatedTopics(req.params.id);
        res.json(topics);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch related topics' });
    }
};
exports.getRelatedTopics = getRelatedTopics;
const updateTopic = async (req, res) => {
    try {
        const updates = updateTopicSchema.parse(req.body);
        const topic = await topicService_1.topicService.updateTopic(req.params.id, updates);
        if (!topic) {
            throw new errors_1.NotFoundError('Topic not found');
        }
        res.json(topic);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid update data', details: error.errors });
        }
        else if (error instanceof errors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update topic' });
        }
    }
};
exports.updateTopic = updateTopic;
const deleteTopic = async (req, res) => {
    try {
        const success = await topicService_1.topicService.deleteTopic(req.params.id);
        if (!success) {
            throw new errors_1.NotFoundError('Topic not found');
        }
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof errors_1.NotFoundError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to delete topic' });
        }
    }
};
exports.deleteTopic = deleteTopic;
