"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const openai_1 = require("openai");
class InstructorService {
    constructor() {
        this.studyContext = '';
        const configuration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openai = new openai_1.OpenAIApi(configuration);
    }
    static getInstance() {
        if (!InstructorService.instance) {
            InstructorService.instance = new InstructorService();
        }
        return InstructorService.instance;
    }
    async updateStudyContext(materials) {
        // Combine all study materials into a context string
        this.studyContext = materials
            .map(material => `${material.title}\n${material.content}`)
            .join('\n\n');
    }
    async getResponse(question) {
        try {
            const prompt = this.createPrompt(question);
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an experienced aviation instructor specializing in SACAA exam preparation. Your responses should be clear, accurate, and focused on helping pilots understand complex aviation concepts. Use examples and analogies when helpful."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });
            return response.data.choices[0].message?.content || 'I apologize, but I was unable to generate a response. Please try rephrasing your question.';
        }
        catch (error) {
            console.error('Error getting AI response:', error);
            throw new Error('Failed to get response from AI instructor');
        }
    }
    createPrompt(question) {
        return `
Context: ${this.studyContext}

Student Question: ${question}

Please provide a clear and concise explanation that helps the student understand this concept in the context of SACAA exam preparation. If relevant, include:
1. Key points to remember
2. Common misconceptions
3. How this might appear in an exam
4. Practical examples or analogies`;
    }
    async loadConversationHistory(userId) {
        try {
            const history = await async_storage_1.default.getItem(`conversation_${userId}`);
            return history ? JSON.parse(history) : [];
        }
        catch (error) {
            console.error('Error loading conversation history:', error);
            return [];
        }
    }
    async saveConversationHistory(userId, messages) {
        try {
            await async_storage_1.default.setItem(`conversation_${userId}`, JSON.stringify(messages));
        }
        catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }
    async generateSimplifiedExplanation(topic) {
        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert aviation instructor who specializes in making complex concepts easy to understand. Your goal is to provide clear, simplified explanations that maintain accuracy while being accessible to students preparing for SACAA exams."
                    },
                    {
                        role: "user",
                        content: `Please provide a simplified explanation of the following aviation topic: ${topic}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });
            return response.data.choices[0].message?.content || 'Unable to generate explanation.';
        }
        catch (error) {
            console.error('Error generating simplified explanation:', error);
            throw new Error('Failed to generate simplified explanation');
        }
    }
    async generateQuizQuestions(topic, count = 5) {
        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert aviation instructor creating SACAA-style exam questions. Generate questions that test understanding rather than mere memorization."
                    },
                    {
                        role: "user",
                        content: `Generate ${count} multiple-choice questions about: ${topic}. Include the correct answer and an explanation for each question.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });
            // Parse and format the response into structured questions
            // Implementation depends on the agreed-upon format for questions
            return []; // Replace with actual parsing logic
        }
        catch (error) {
            console.error('Error generating quiz questions:', error);
            throw new Error('Failed to generate quiz questions');
        }
    }
}
exports.default = InstructorService;
