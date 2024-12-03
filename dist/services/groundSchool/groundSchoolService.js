"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const aiService_1 = __importDefault(require("../ai/aiService"));
class GroundSchoolService {
    constructor() {
        this.STORAGE_KEYS = {
            TOPICS: '@ground_school_topics',
            PROGRESS: '@topic_progress',
        };
    }
    static getInstance() {
        if (!GroundSchoolService.instance) {
            GroundSchoolService.instance = new GroundSchoolService();
        }
        return GroundSchoolService.instance;
    }
    // Get all topics
    async getAllTopics() {
        try {
            const topicsStr = await async_storage_1.default.getItem(this.STORAGE_KEYS.TOPICS);
            return topicsStr ? JSON.parse(topicsStr) : [];
        }
        catch (error) {
            console.error('Error getting topics:', error);
            throw error;
        }
    }
    // Get topics by category
    async getTopicsByCategory(category) {
        try {
            const allTopics = await this.getAllTopics();
            return allTopics.filter(topic => topic.category === category);
        }
        catch (error) {
            console.error('Error getting topics by category:', error);
            throw error;
        }
    }
    // Get topic by ID
    async getTopicById(topicId) {
        try {
            const topics = await this.getAllTopics();
            return topics.find(topic => topic.id === topicId) || null;
        }
        catch (error) {
            console.error('Error getting topic by ID:', error);
            throw error;
        }
    }
    // Get recommended topics based on user progress and preferences
    async getRecommendedTopics(userId) {
        try {
            const [allTopics, progress] = await Promise.all([
                this.getAllTopics(),
                this.getUserProgress(userId),
            ]);
            // Get incomplete topics
            const incompleteTags = new Set();
            const completedTopicIds = new Set(progress
                .filter(p => p.isCompleted)
                .map(p => p.topicId));
            // Collect tags from completed topics
            allTopics
                .filter(topic => completedTopicIds.has(topic.id))
                .forEach(topic => topic.tags.forEach(tag => incompleteTags.add(tag)));
            // Find topics with similar tags that aren't completed
            return allTopics
                .filter(topic => !completedTopicIds.has(topic.id))
                .sort((a, b) => {
                const aMatchCount = a.tags.filter(tag => incompleteTags.has(tag)).length;
                const bMatchCount = b.tags.filter(tag => incompleteTags.has(tag)).length;
                return bMatchCount - aMatchCount;
            })
                .slice(0, 5);
        }
        catch (error) {
            console.error('Error getting recommended topics:', error);
            throw error;
        }
    }
    // Get user progress for all topics
    async getUserProgress(userId) {
        try {
            const progressStr = await async_storage_1.default.getItem(`${this.STORAGE_KEYS.PROGRESS}_${userId}`);
            return progressStr ? JSON.parse(progressStr) : [];
        }
        catch (error) {
            console.error('Error getting user progress:', error);
            throw error;
        }
    }
    // Update topic progress
    async updateTopicProgress(userId, topicId, updates) {
        try {
            const progress = await this.getUserProgress(userId);
            const existingProgress = progress.find(p => p.topicId === topicId);
            if (existingProgress) {
                Object.assign(existingProgress, updates);
            }
            else {
                progress.push({
                    userId,
                    topicId,
                    isCompleted: false,
                    lastAccessed: Date.now(),
                    timeSpent: 0,
                    notes: [],
                    ...updates,
                });
            }
            await async_storage_1.default.setItem(`${this.STORAGE_KEYS.PROGRESS}_${userId}`, JSON.stringify(progress));
        }
        catch (error) {
            console.error('Error updating topic progress:', error);
            throw error;
        }
    }
    // Add note to topic
    async addNoteToTopic(userId, topicId, note) {
        try {
            const progress = await this.getUserProgress(userId);
            const topicProgress = progress.find(p => p.topicId === topicId);
            if (topicProgress) {
                topicProgress.notes.push(note);
            }
            else {
                progress.push({
                    userId,
                    topicId,
                    isCompleted: false,
                    lastAccessed: Date.now(),
                    timeSpent: 0,
                    notes: [note],
                });
            }
            await async_storage_1.default.setItem(`${this.STORAGE_KEYS.PROGRESS}_${userId}`, JSON.stringify(progress));
        }
        catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    }
    // Get simplified explanation using AI
    async getSimplifiedExplanation(content) {
        try {
            const aiService = aiService_1.default.getInstance();
            return await aiService.generateSimplifiedExplanation(content);
        }
        catch (error) {
            console.error('Error getting simplified explanation:', error);
            throw error;
        }
    }
    // Get related topics
    async getRelatedTopics(topicId) {
        try {
            const allTopics = await this.getAllTopics();
            const currentTopic = allTopics.find(t => t.id === topicId);
            if (!currentTopic) {
                throw new Error('Topic not found');
            }
            // Find topics with matching tags or category
            return allTopics
                .filter(topic => topic.id !== topicId && (topic.category === currentTopic.category ||
                topic.tags.some(tag => currentTopic.tags.includes(tag))))
                .sort((a, b) => {
                const aMatchCount = a.tags.filter(tag => currentTopic.tags.includes(tag)).length;
                const bMatchCount = b.tags.filter(tag => currentTopic.tags.includes(tag)).length;
                return bMatchCount - aMatchCount;
            })
                .slice(0, 5);
        }
        catch (error) {
            console.error('Error getting related topics:', error);
            throw error;
        }
    }
}
