"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
const router = express_1.default.Router();
// Generate questions from content
router.post('/questions', aiController_1.aiController.generateQuestions);
// Get explanation for a concept
router.post('/explain', aiController_1.aiController.explainConcept);
// Generate personalized study plan
router.post('/study-plan', aiController_1.aiController.generateStudyPlan);
// Analyze quiz performance
router.post('/analyze', aiController_1.aiController.analyzePerformance);
exports.default = router;
