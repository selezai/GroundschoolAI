"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const questionApi_1 = __importDefault(require("./api/questionApi"));
class QuestionService {
    constructor() {
        this.currentSession = null;
        this.currentQuestions = null;
        this.currentQuestionIndex = 0;
        this.timer = null;
        this.timeSpent = 0;
    }
    async getQuestionSets() {
        return await questionApi_1.default.getQuestionSets();
    }
    async getRecommendedSets() {
        return await questionApi_1.default.getRecommendedSets();
    }
    async startQuiz(setId) {
        // Clear any existing session
        this.clearSession();
        // Start new session
        this.currentSession = await questionApi_1.default.startQuizSession(setId);
        this.currentQuestions = await questionApi_1.default.getQuestions(setId);
        this.currentQuestionIndex = 0;
        this.timeSpent = 0;
        // Start timer
        this.startTimer();
        return {
            session: this.currentSession,
            firstQuestion: this.currentQuestions[0],
        };
    }
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            this.timeSpent += 1;
        }, 1000);
    }
    clearSession() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.currentSession = null;
        this.currentQuestions = null;
        this.currentQuestionIndex = 0;
        this.timeSpent = 0;
    }
    async submitAnswer(selectedOptionIndex) {
        if (!this.currentSession || !this.currentQuestions) {
            throw new Error('No active quiz session');
        }
        const currentQuestion = this.currentQuestions[this.currentQuestionIndex];
        const result = await questionApi_1.default.submitAnswer(this.currentSession.id, currentQuestion.id, {
            selectedOptionIndex,
            timeSpent: this.timeSpent,
        });
        // Reset timer for next question
        this.timeSpent = 0;
        // Move to next question
        this.currentQuestionIndex++;
        const nextQuestion = this.currentQuestionIndex < this.currentQuestions.length
            ? this.currentQuestions[this.currentQuestionIndex]
            : undefined;
        // Calculate progress
        const progress = this.calculateProgress();
        return {
            result,
            nextQuestion,
            progress,
        };
    }
    calculateProgress() {
        if (!this.currentSession || !this.currentQuestions) {
            throw new Error('No active quiz session');
        }
        const answers = this.currentSession.answers;
        const totalQuestions = this.currentQuestions.length;
        const answeredQuestions = answers.length;
        const correctAnswers = answers.filter((a) => a.isCorrect).length;
        return {
            totalQuestions,
            answeredQuestions,
            correctAnswers,
            incorrectAnswers: answeredQuestions - correctAnswers,
            score: (correctAnswers / totalQuestions) * 100,
            timeSpent: answers.reduce((total, a) => total + a.timeSpent, 0),
        };
    }
    async completeQuiz() {
        if (!this.currentSession) {
            throw new Error('No active quiz session');
        }
        const completedSession = await questionApi_1.default.completeQuizSession(this.currentSession.id);
        const progress = this.calculateProgress();
        // Clear the session
        this.clearSession();
        return {
            session: completedSession,
            progress,
        };
    }
    async getUserStats() {
        return await questionApi_1.default.getUserStats();
    }
    getCurrentQuestion() {
        if (!this.currentQuestions)
            return null;
        return this.currentQuestions[this.currentQuestionIndex];
    }
    getProgress() {
        if (!this.currentSession || !this.currentQuestions)
            return null;
        return this.calculateProgress();
    }
}
exports.default = new QuestionService();
