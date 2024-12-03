"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.getTopicById = exports.getAllTopics = void 0;
const topicService_1 = require("../services/topicService");
const getAllTopics = async (req, res) => {
    try {
        const topics = await topicService_1.topicService.getAllTopics();
        res.json(topics);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllTopics = getAllTopics;
const getTopicById = async (req, res) => {
    try {
        const topic = await topicService_1.topicService.getTopicById(req.params.id);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        res.json(topic);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTopicById = getTopicById;
const createTopic = async (req, res) => {
    try {
        const topic = await topicService_1.topicService.createTopic(req.body);
        res.status(201).json(topic);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createTopic = createTopic;
const updateTopic = async (req, res) => {
    try {
        const topic = await topicService_1.topicService.updateTopic(req.params.id, req.body);
        res.json(topic);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateTopic = updateTopic;
const deleteTopic = async (req, res) => {
    try {
        await topicService_1.topicService.deleteTopic(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteTopic = deleteTopic;
