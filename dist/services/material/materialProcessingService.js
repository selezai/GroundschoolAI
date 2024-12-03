"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("openai");
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const FileSystem = __importStar(require("expo-file-system"));
class MaterialProcessingService {
    constructor() {
        this.STORAGE_KEY = '@processed_materials';
        const configuration = new openai_1.Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openai = new openai_1.OpenAIApi(configuration);
    }
    static getInstance() {
        if (!MaterialProcessingService.instance) {
            MaterialProcessingService.instance = new MaterialProcessingService();
        }
        return MaterialProcessingService.instance;
    }
    async processStudyMaterial(input) {
        try {
            // Create a directory for the user if it doesn't exist
            const userDir = `${FileSystem.documentDirectory}users/${input.userId}/materials`;
            await FileSystem.makeDirectoryAsync(userDir, { intermediates: true });
            // Save the original file
            const fileName = this.sanitizeFileName(input.fileName);
            const filePath = `${userDir}/${fileName}`;
            await FileSystem.writeAsStringAsync(filePath, input.content, {
                encoding: FileSystem.EncodingType.Base64,
            });
            // Extract text from the file
            const extractedText = await this.extractText(input);
            // Process the content using GPT-4 for comprehensive analysis
            const processedContent = await this.processContent(extractedText);
            // Generate initial question bank
            await this.generateQuestionBank(input.userId, fileName, extractedText);
            // Initialize AI instructor context
            await this.initializeAIInstructor(input.userId, fileName, processedContent);
            // Save the processed content
            await this.saveProcessedContent(input.userId, fileName, processedContent);
            // Update the study materials index
            await this.updateMaterialsIndex(input.userId, {
                fileName,
                originalName: input.fileName,
                fileType: input.fileType,
                uploadDate: new Date().toISOString(),
                topics: processedContent.topics,
                hasQuestionBank: true,
                hasAIInstructor: true,
            });
        }
        catch (error) {
            console.error('Error processing study material:', error);
            throw new Error('Failed to process study material');
        }
    }
    async extractText(input) {
        // For images, use OCR (e.g., Tesseract.js or cloud OCR service)
        // For PDFs, use a PDF parser
        // This is a placeholder implementation
        return 'Extracted text from document';
    }
    async processContent(text) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing aviation study materials and extracting key information for SACAA exam preparation.',
                    },
                    {
                        role: 'user',
                        content: `Please perform a comprehensive analysis of the following aviation study material to create:
1. Main topics covered
2. Key points likely to appear in SACAA exams
3. A structured study guide with sections, importance levels, and exam tips
4. An initial set of practice questions with explanations

Content: ${text}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });
            const result = response.data.choices[0]?.message?.content;
            if (!result)
                throw new Error('Failed to process content');
            // Parse the AI response into structured content
            return this.parseAIResponse(result);
        }
        catch (error) {
            console.error('Error processing content:', error);
            throw error;
        }
    }
    async generateQuestionBank(userId, fileName, content) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at creating aviation exam questions in the style of SACAA exams.',
                    },
                    {
                        role: 'user',
                        content: `Create a comprehensive question bank from the following study material. For each topic, generate multiple-choice questions that test understanding at different difficulty levels.

Content: ${content}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });
            // Save question bank
            const questionBankPath = `${FileSystem.documentDirectory}users/${userId}/question_banks/${fileName}_questions.json`;
            await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}users/${userId}/question_banks/`, { intermediates: true });
            await FileSystem.writeAsStringAsync(questionBankPath, JSON.stringify(response.data.choices[0]?.message?.content));
        }
        catch (error) {
            console.error('Error generating question bank:', error);
            throw error;
        }
    }
    async initializeAIInstructor(userId, fileName, processedContent) {
        try {
            // Save AI instructor context
            const contextPath = `${FileSystem.documentDirectory}users/${userId}/ai_context/${fileName}_context.json`;
            await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}users/${userId}/ai_context/`, { intermediates: true });
            const instructorContext = {
                topics: processedContent.topics,
                keyPoints: processedContent.keyPoints,
                studyGuide: processedContent.studyGuide,
                lastInteraction: new Date().toISOString(),
                conversationHistory: [],
            };
            await FileSystem.writeAsStringAsync(contextPath, JSON.stringify(instructorContext));
        }
        catch (error) {
            console.error('Error initializing AI instructor:', error);
            throw error;
        }
    }
    parseAIResponse(response) {
        try {
            // Split the response into sections based on expected format
            const sections = response.split('\n\n');
            // Extract topics (assuming first section contains topics)
            const topics = sections[0]
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace('-', '').trim());
            // Extract key points
            const keyPoints = sections[1]
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace('-', '').trim());
            // Parse study guide sections
            const studyGuideSections = sections[2]
                .split('\n---\n')
                .map(section => {
                const [topic, content, importance, ...tips] = section.split('\n');
                return {
                    topic: topic.trim(),
                    content: content.trim(),
                    importance: importance.toLowerCase(),
                    examTips: tips.map(tip => tip.trim()),
                };
            });
            // Parse question bank
            const questionBankRaw = sections[3]
                .split('\n===\n')
                .map(topicSection => {
                const [topic, ...questionBlocks] = topicSection.split('\n---\n');
                const questions = questionBlocks.map(block => {
                    const [question, ...rest] = block.split('\n');
                    const options = rest.slice(0, -2).map(opt => opt.trim());
                    const correctAnswer = rest[rest.length - 2].trim();
                    const explanation = rest[rest.length - 1].trim();
                    return {
                        question: question.trim(),
                        options,
                        correctAnswer,
                        explanation,
                    };
                });
                return {
                    topic: topic.trim(),
                    questions,
                };
            });
            return {
                text: response,
                topics,
                keyPoints,
                questionBank: questionBankRaw,
                studyGuide: {
                    sections: studyGuideSections,
                },
            };
        }
        catch (error) {
            console.error('Error parsing AI response:', error);
            // Return a safe default structure if parsing fails
            return {
                text: response,
                topics: [],
                keyPoints: [],
                questionBank: [],
                studyGuide: {
                    sections: [],
                },
            };
        }
    }
    async saveProcessedContent(userId, fileName, content) {
        try {
            const contentPath = `${FileSystem.documentDirectory}users/${userId}/processed/${fileName}_processed.json`;
            await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}users/${userId}/processed/`, { intermediates: true });
            await FileSystem.writeAsStringAsync(contentPath, JSON.stringify(content));
        }
        catch (error) {
            console.error('Error saving processed content:', error);
            throw new Error('Failed to save processed content');
        }
    }
    async updateMaterialsIndex(userId, material) {
        try {
            const key = `${this.STORAGE_KEY}_${userId}`;
            const existingData = await async_storage_1.default.getItem(key);
            const materials = existingData ? JSON.parse(existingData) : [];
            // Update or add the material
            const existingIndex = materials.findIndex((m) => m.fileName === material.fileName);
            if (existingIndex >= 0) {
                materials[existingIndex] = material;
            }
            else {
                materials.push(material);
            }
            await async_storage_1.default.setItem(key, JSON.stringify(materials));
        }
        catch (error) {
            console.error('Error updating materials index:', error);
            throw new Error('Failed to update materials index');
        }
    }
    async getUserMaterials(userId) {
        try {
            const key = `${this.STORAGE_KEY}_${userId}`;
            const data = await async_storage_1.default.getItem(key);
            return data ? JSON.parse(data) : [];
        }
        catch (error) {
            console.error('Error getting user materials:', error);
            return [];
        }
    }
    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
}
exports.default = MaterialProcessingService;
