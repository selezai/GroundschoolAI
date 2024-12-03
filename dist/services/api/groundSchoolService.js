"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _env_1 = require("@env");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
class GroundSchoolService {
    constructor() { }
    static getInstance() {
        if (!GroundSchoolService.instance) {
            GroundSchoolService.instance = new GroundSchoolService();
        }
        return GroundSchoolService.instance;
    }
    async getHeaders() {
        const token = await async_storage_1.default.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    // Get all available topics
    async getTopics() {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/groundschool/topics`, { headers });
            return response.data.topics;
        }
        catch (error) {
            console.error('Error fetching topics:', error);
            throw error;
        }
    }
    // Get topics by category
    async getTopicsByCategory(category) {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/groundschool/topics/category/${category}`, { headers });
            return response.data.topics;
        }
        catch (error) {
            console.error('Error fetching topics by category:', error);
            throw error;
        }
    }
    // Get explanation for a specific topic
    async getExplanation(topicId) {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/groundschool/explanations/${topicId}`, { headers });
            return response.data.explanation;
        }
        catch (error) {
            console.error('Error fetching explanation:', error);
            throw error;
        }
    }
    // Request AI to generate a new explanation
    async generateExplanation(topicId, context) {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/groundschool/explanations/generate`, {
                topicId,
                context,
            }, { headers });
            // Cache the generated explanation
            await async_storage_1.default.setItem(`explanation_${topicId}_${context}`, JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            // Try to fetch from cache if offline
            const cachedData = await async_storage_1.default.getItem(`explanation_${topicId}_${context}`);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            throw error;
        }
    }
    // Save explanation for offline access
    async saveExplanationOffline(explanation) {
        try {
            const savedExplanations = await async_storage_1.default.getItem('offlineExplanations');
            const explanations = savedExplanations ? JSON.parse(savedExplanations) : {};
            explanations[explanation.topicId] = {
                ...explanation,
                savedAt: new Date().toISOString(),
            };
            await async_storage_1.default.setItem('offlineExplanations', JSON.stringify(explanations));
        }
        catch (error) {
            console.error('Error saving explanation offline:', error);
            throw error;
        }
    }
    // Get offline explanation
    async getOfflineExplanation(topicId) {
        try {
            const savedExplanations = await async_storage_1.default.getItem('offlineExplanations');
            if (!savedExplanations)
                return null;
            const explanations = JSON.parse(savedExplanations);
            return explanations[topicId] || null;
        }
        catch (error) {
            console.error('Error getting offline explanation:', error);
            return null;
        }
    }
    // Track user progress
    async trackProgress(topicId, completed) {
        try {
            const headers = await this.getHeaders();
            await axios_1.default.post(`${_env_1.API_URL}/api/groundschool/progress`, {
                topicId,
                completed,
                timestamp: new Date().toISOString(),
            }, { headers });
        }
        catch (error) {
            console.error('Error tracking progress:', error);
            // Store offline if request fails
            await this.saveProgressOffline(topicId, completed);
        }
    }
    // Save progress offline
    async saveProgressOffline(topicId, completed) {
        try {
            const savedProgress = await async_storage_1.default.getItem('offlineProgress');
            const progress = savedProgress ? JSON.parse(savedProgress) : {};
            progress[topicId] = {
                completed,
                timestamp: new Date().toISOString(),
                synced: false,
            };
            await async_storage_1.default.setItem('offlineProgress', JSON.stringify(progress));
        }
        catch (error) {
            console.error('Error saving progress offline:', error);
        }
    }
}
exports.default = GroundSchoolService.getInstance();
