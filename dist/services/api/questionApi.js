"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const auth_1 = require("../auth");
const quizStorage_1 = __importDefault(require("../storage/quizStorage")); // Assuming quizStorage is imported from this location
const questionApi = {
    async getQuestionSets() {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/sets`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getQuestionSet(setId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/sets/${setId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getQuestions(setId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/sets/${setId}/questions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async startQuizSession(setId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/questions/sessions`, { questionSetId: setId }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async submitAnswer(sessionId, questionId, answer) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/questions/sessions/${sessionId}/answers`, {
            questionId,
            ...answer,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async completeQuizSession(sessionId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.post(`${config_1.API_BASE_URL}/questions/sessions/${sessionId}/complete`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getUserStats() {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getQuizSession(sessionId) {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/sessions/${sessionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getRecommendedSets() {
        const token = await (0, auth_1.getAuthToken)();
        const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/sets/recommended`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
    async getQuizReview(sessionId) {
        try {
            // First try to get from local storage
            const offlineData = await quizStorage_1.default.getQuizReview(sessionId);
            if (offlineData) {
                return { questions: offlineData };
            }
            // If not in storage, fetch from API
            const token = await (0, auth_1.getAuthToken)();
            const response = await axios_1.default.get(`${config_1.API_BASE_URL}/questions/sessions/${sessionId}/review`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Save to local storage for offline access
            await quizStorage_1.default.saveQuizReview(sessionId, response.data.questions);
            return response.data;
        }
        catch (error) {
            console.error('Error getting quiz review:', error);
            // If offline and data exists in storage, return that
            const offlineData = await quizStorage_1.default.getQuizReview(sessionId);
            if (offlineData) {
                return { questions: offlineData };
            }
            throw error;
        }
    },
};
exports.default = questionApi;
