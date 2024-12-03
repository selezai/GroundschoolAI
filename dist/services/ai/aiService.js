"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const _env_1 = require("@env");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const _env_2 = require("@env");
const anthropic = new sdk_1.default({
    apiKey: _env_2.ANTHROPIC_API_KEY,
});
class AIService {
    constructor() { }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    async getHeaders() {
        const token = await async_storage_1.default.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    async generateQuestions(request) {
        try {
            const prompt = `Generate ${request.count} aviation exam questions about ${request.topic}${request.difficulty ? ` at ${request.difficulty} difficulty` : ''}. Each question should be multiple choice with 4 options.
      
      ${request.context ? `Use this context: ${request.context}` : ''}
      
      Format each question as a JSON object with:
      - text: The question text
      - options: Array of 4 possible answers
      - correctAnswer: Index of correct answer (0-3)
      - explanation: Detailed explanation of the correct answer
      - topic: Main topic
      - subtopic: Specific subtopic
      - difficulty: "easy", "medium", or "hard"

      Return an array of these question objects.`;
            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 2000,
                messages: [{
                        role: 'user',
                        content: prompt,
                    }],
                temperature: 0.7,
            });
            const questions = JSON.parse(response.content[0].text);
            // Cache the generated questions
            const cacheKey = `questions_${request.topic}_${request.difficulty || 'all'}`;
            await async_storage_1.default.setItem(cacheKey, JSON.stringify(questions));
            return questions;
        }
        catch (error) {
            // Try to fetch from cache if request fails
            const cacheKey = `questions_${request.topic}_${request.difficulty || 'all'}`;
            const cached = await async_storage_1.default.getItem(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    }
    async generateExplanation(request) {
        try {
            const prompt = `Explain the aviation topic: ${request.topic}
      
      ${request.context ? `Use this context: ${request.context}` : ''}
      
      Style: ${request.style || 'detailed'}
      
      ${request.previousExplanations ?
                `Previous explanations to build upon: ${request.previousExplanations.join('\n')}` : ''}
      
      Provide a clear, comprehensive explanation suitable for a ground school student.`;
            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1500,
                messages: [{
                        role: 'user',
                        content: prompt,
                    }],
                temperature: 0.7,
            });
            const explanation = response.content[0].text;
            // Cache the explanation
            const cacheKey = `explanation_${request.topic}_${request.style || 'detailed'}`;
            await async_storage_1.default.setItem(cacheKey, explanation);
            return explanation;
        }
        catch (error) {
            // Try to fetch from cache if request fails
            const cacheKey = `explanation_${request.topic}_${request.style || 'detailed'}`;
            const cached = await async_storage_1.default.getItem(cacheKey);
            if (cached) {
                return cached;
            }
            throw error;
        }
    }
    async getChatResponse(request) {
        try {
            const messages = request.previousMessages || [];
            const prompt = `You are an experienced flight instructor helping a student with ground school studies.
      
      Student question: ${request.question}
      
      ${request.context ? `Context from study materials: ${request.context}` : ''}
      
      Previous conversation:
      ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
      
      Provide a helpful, accurate response that helps the student understand the concept deeply.`;
            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1000,
                messages: [{
                        role: 'user',
                        content: prompt,
                    }],
                temperature: 0.7,
            });
            const newMessage = {
                role: 'assistant',
                content: response.content[0].text,
                timestamp: Date.now(),
            };
            // Cache the conversation
            const conversationCache = await this.getCachedConversation();
            conversationCache.push(newMessage);
            await async_storage_1.default.setItem('chat_history', JSON.stringify(conversationCache));
            return newMessage;
        }
        catch (error) {
            throw error;
        }
    }
    async updateProgress(update) {
        try {
            const headers = await this.getHeaders();
            await axios_1.default.post(`${_env_1.API_URL}/api/progress/update`, update, { headers });
            // Cache progress update locally
            const cacheKey = `progress_${update.userId}_${update.topicId}`;
            const cachedUpdates = await this.getCachedProgressUpdates(cacheKey);
            cachedUpdates.push(update);
            await async_storage_1.default.setItem(cacheKey, JSON.stringify(cachedUpdates));
        }
        catch (error) {
            // Store failed update for later sync
            const pendingUpdates = await this.getPendingProgressUpdates();
            pendingUpdates.push(update);
            await async_storage_1.default.setItem('pending_progress_updates', JSON.stringify(pendingUpdates));
        }
    }
    async getCachedProgressUpdates(cacheKey) {
        const cached = await async_storage_1.default.getItem(cacheKey);
        return cached ? JSON.parse(cached) : [];
    }
    async getPendingProgressUpdates() {
        const pending = await async_storage_1.default.getItem('pending_progress_updates');
        return pending ? JSON.parse(pending) : [];
    }
    async syncPendingProgressUpdates() {
        const pendingUpdates = await this.getPendingProgressUpdates();
        if (pendingUpdates.length === 0)
            return;
        const headers = await this.getHeaders();
        try {
            await axios_1.default.post(`${_env_1.API_URL}/api/progress/batch-update`, { updates: pendingUpdates }, { headers });
            await async_storage_1.default.removeItem('pending_progress_updates');
        }
        catch (error) {
            console.error('Failed to sync pending progress updates:', error);
        }
    }
    async getProgressSummary(userId, topicId) {
        try {
            const headers = await this.getHeaders();
            const response = await axios_1.default.get(`${_env_1.API_URL}/api/progress/summary/${userId}${topicId ? `/${topicId}` : ''}`, { headers });
            return response.data;
        }
        catch (error) {
            // Return cached summary if available
            const cacheKey = `progress_summary_${userId}${topicId ? `_${topicId}` : ''}`;
            const cached = await async_storage_1.default.getItem(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    }
    async getCachedConversation() {
        const cached = await async_storage_1.default.getItem('chat_history');
        return cached ? JSON.parse(cached) : [];
    }
}
exports.default = AIService;
