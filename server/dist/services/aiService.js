"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AIService {
    constructor() {
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    async generateQuestions(content, numQuestions = 5) {
        const prompt = `You are an expert aviation instructor. Generate ${numQuestions} multiple-choice questions based on the following aviation content. 
    Format each question with:
    - The question
    - 4 possible answers (A, B, C, D)
    - The correct answer
    - A detailed explanation of why the answer is correct
    
    Content: ${content}`;
        const response = await this.anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1500,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        return response.content[0].text;
    }
    async explainConcept(concept) {
        const prompt = `You are an expert aviation instructor. Explain the following aviation concept in detail, using clear language and relevant examples:
    
    Concept: ${concept}`;
        const response = await this.anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        return response.content[0].text;
    }
    async generateStudyPlan(topics, timeFrame) {
        const prompt = `As an expert aviation instructor, create a detailed study plan for the following aviation topics over ${timeFrame}. 
    Include:
    - Daily breakdown of topics
    - Estimated study time per topic
    - Key concepts to focus on
    - Practice recommendations
    
    Topics: ${topics.join(', ')}`;
        const response = await this.anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1500,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        return response.content[0].text;
    }
    async analyzePerformance(answers) {
        const prompt = `As an expert aviation instructor, analyze the student's performance on these questions. 
    Provide:
    - Areas of strength
    - Areas needing improvement
    - Specific study recommendations
    - Topics to review
    
    Questions and Answers:
    ${answers.map(a => `
      Question: ${a.question}
      User's Answer: ${a.userAnswer}
      Correct Answer: ${a.correctAnswer}
    `).join('\n')}`;
        const response = await this.anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        return response.content[0].text;
    }
}
exports.aiService = new AIService();
