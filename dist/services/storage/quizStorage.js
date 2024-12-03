"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const STORAGE_KEYS = {
    QUIZ_REVIEWS: '@quiz_reviews',
    QUIZ_SESSIONS: '@quiz_sessions',
};
const quizStorage = {
    async saveQuizReview(sessionId, reviewData) {
        try {
            // Get existing reviews
            const existingReviews = await this.getStoredReviews();
            // Add new review
            const newReview = {
                sessionId,
                timestamp: Date.now(),
                questions: reviewData,
            };
            existingReviews.push(newReview);
            // Keep only the last 10 reviews to manage storage space
            const recentReviews = existingReviews.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
            await async_storage_1.default.setItem(STORAGE_KEYS.QUIZ_REVIEWS, JSON.stringify(recentReviews));
        }
        catch (error) {
            console.error('Error saving quiz review:', error);
            throw error;
        }
    },
    async getQuizReview(sessionId) {
        try {
            const reviews = await this.getStoredReviews();
            const review = reviews.find(r => r.sessionId === sessionId);
            return review ? review.questions : null;
        }
        catch (error) {
            console.error('Error getting quiz review:', error);
            throw error;
        }
    },
    async getAllQuizReviews() {
        return this.getStoredReviews();
    },
    async getStoredReviews() {
        try {
            const storedReviews = await async_storage_1.default.getItem(STORAGE_KEYS.QUIZ_REVIEWS);
            return storedReviews ? JSON.parse(storedReviews) : [];
        }
        catch (error) {
            console.error('Error getting stored reviews:', error);
            return [];
        }
    },
    async clearAllReviews() {
        try {
            await async_storage_1.default.removeItem(STORAGE_KEYS.QUIZ_REVIEWS);
        }
        catch (error) {
            console.error('Error clearing reviews:', error);
            throw error;
        }
    },
};
exports.default = quizStorage;
