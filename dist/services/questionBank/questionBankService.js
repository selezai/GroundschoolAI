"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
class QuestionBankService {
    constructor() {
        this.STORAGE_KEYS = {
            QUESTIONS: '@questions',
            USER_ANSWERS: '@user_answers',
            QUESTION_SETS: '@question_sets',
        };
    }
    static getInstance() {
        if (!QuestionBankService.instance) {
            QuestionBankService.instance = new QuestionBankService();
        }
        return QuestionBankService.instance;
    }
    // Generate questions from study material
    async generateQuestions(materialId, content) {
        try {
            // TODO: Implement AI-based question generation
            // This will be integrated with OpenAI or similar service
            return [];
        }
        catch (error) {
            console.error('Error generating questions:', error);
            throw error;
        }
    }
    // Get questions by category
    async getQuestionsByCategory(category) {
        try {
            const questions = await this.getAllQuestions();
            return questions.filter(q => q.category === category);
        }
        catch (error) {
            console.error('Error getting questions by category:', error);
            throw error;
        }
    }
    // Get all questions
    async getAllQuestions() {
        try {
            const questionsStr = await async_storage_1.default.getItem(this.STORAGE_KEYS.QUESTIONS);
            return questionsStr ? JSON.parse(questionsStr) : [];
        }
        catch (error) {
            console.error('Error getting all questions:', error);
            throw error;
        }
    }
    // Save user's answer
    async saveUserAnswer(answer) {
        try {
            const answers = await this.getUserAnswers(answer.questionId);
            const updatedAnswers = [...answers, answer];
            await async_storage_1.default.setItem(`${this.STORAGE_KEYS.USER_ANSWERS}_${answer.questionId}`, JSON.stringify(updatedAnswers));
        }
        catch (error) {
            console.error('Error saving user answer:', error);
            throw error;
        }
    }
    // Get user's answers for a question
    async getUserAnswers(questionId) {
        try {
            const answersStr = await async_storage_1.default.getItem(`${this.STORAGE_KEYS.USER_ANSWERS}_${questionId}`);
            return answersStr ? JSON.parse(answersStr) : [];
        }
        catch (error) {
            console.error('Error getting user answers:', error);
            throw error;
        }
    }
    // Create a new question set
    async createQuestionSet(set) {
        try {
            const sets = await this.getQuestionSets();
            const updatedSets = [...sets, set];
            await async_storage_1.default.setItem(this.STORAGE_KEYS.QUESTION_SETS, JSON.stringify(updatedSets));
        }
        catch (error) {
            console.error('Error creating question set:', error);
            throw error;
        }
    }
    // Get all question sets
    async getQuestionSets() {
        try {
            const setsStr = await async_storage_1.default.getItem(this.STORAGE_KEYS.QUESTION_SETS);
            return setsStr ? JSON.parse(setsStr) : [];
        }
        catch (error) {
            console.error('Error getting question sets:', error);
            throw error;
        }
    }
    // Get user's performance statistics
    async getUserPerformance(userId) {
        try {
            const questions = await this.getAllQuestions();
            const performance = {
                totalAnswered: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                categoryPerformance: {},
            };
            for (const question of questions) {
                const answers = await this.getUserAnswers(question.id);
                if (answers.length > 0) {
                    performance.totalAnswered++;
                    const lastAnswer = answers[answers.length - 1];
                    if (lastAnswer.isCorrect) {
                        performance.correctAnswers++;
                    }
                    else {
                        performance.incorrectAnswers++;
                    }
                    // Update category performance
                    if (!performance.categoryPerformance[question.category]) {
                        performance.categoryPerformance[question.category] = 0;
                    }
                    if (lastAnswer.isCorrect) {
                        performance.categoryPerformance[question.category]++;
                    }
                }
            }
            return performance;
        }
        catch (error) {
            console.error('Error getting user performance:', error);
            throw error;
        }
    }
    // Get recommended questions based on user performance
    async getRecommendedQuestions(userId) {
        try {
            const performance = await this.getUserPerformance(userId);
            const questions = await this.getAllQuestions();
            // Find categories where performance is lowest
            const categoryPerformance = Object.entries(performance.categoryPerformance)
                .sort(([, a], [, b]) => a - b)
                .map(([category]) => category);
            // Prioritize questions from weaker categories
            return questions
                .filter(q => !this.hasAnsweredCorrectly(userId, q.id))
                .sort((a, b) => {
                const aCategoryIndex = categoryPerformance.indexOf(a.category);
                const bCategoryIndex = categoryPerformance.indexOf(b.category);
                return aCategoryIndex - bCategoryIndex;
            })
                .slice(0, 10); // Return top 10 recommended questions
        }
        catch (error) {
            console.error('Error getting recommended questions:', error);
            throw error;
        }
    }
    // Check if user has answered a question correctly
    async hasAnsweredCorrectly(userId, questionId) {
        const answers = await this.getUserAnswers(questionId);
        return answers.some(a => a.userId === userId && a.isCorrect);
    }
}
