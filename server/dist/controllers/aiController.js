"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const aiService_1 = require("../services/aiService");
exports.aiController = {
    async generateQuestions(req, res) {
        try {
            const { content, numQuestions } = req.body;
            if (!content) {
                return res.status(400).json({ error: 'Content is required' });
            }
            const questions = await aiService_1.aiService.generateQuestions(content, numQuestions);
            res.json({ questions });
        }
        catch (error) {
            console.error('Error generating questions:', error);
            res.status(500).json({ error: 'Failed to generate questions' });
        }
    },
    async explainConcept(req, res) {
        try {
            const { concept } = req.body;
            if (!concept) {
                return res.status(400).json({ error: 'Concept is required' });
            }
            const explanation = await aiService_1.aiService.explainConcept(concept);
            res.json({ explanation });
        }
        catch (error) {
            console.error('Error explaining concept:', error);
            res.status(500).json({ error: 'Failed to explain concept' });
        }
    },
    async generateStudyPlan(req, res) {
        try {
            const { topics, timeFrame } = req.body;
            if (!topics || !timeFrame) {
                return res.status(400).json({ error: 'Topics and timeFrame are required' });
            }
            const studyPlan = await aiService_1.aiService.generateStudyPlan(topics, timeFrame);
            res.json({ studyPlan });
        }
        catch (error) {
            console.error('Error generating study plan:', error);
            res.status(500).json({ error: 'Failed to generate study plan' });
        }
    },
    async analyzePerformance(req, res) {
        try {
            const { answers } = req.body;
            if (!answers || !Array.isArray(answers)) {
                return res.status(400).json({ error: 'Valid answers array is required' });
            }
            const analysis = await aiService_1.aiService.analyzePerformance(answers);
            res.json({ analysis });
        }
        catch (error) {
            console.error('Error analyzing performance:', error);
            res.status(500).json({ error: 'Failed to analyze performance' });
        }
    }
};
