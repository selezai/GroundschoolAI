"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../../lib/supabase");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const _env_1 = require("@env");
const anthropic = new sdk_1.default({
    apiKey: _env_1.ANTHROPIC_API_KEY,
});
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
class ProcessingService {
    constructor() { }
    static getInstance() {
        if (!ProcessingService.instance) {
            ProcessingService.instance = new ProcessingService();
        }
        return ProcessingService.instance;
    }
    async processNewMaterial(material) {
        try {
            // Create processing tasks
            const tasks = await this.createProcessingTasks(material.id);
            // Start processing pipeline
            await this.startProcessingPipeline(material, tasks);
        }
        catch (error) {
            console.error('Error processing material:', error);
            await this.updateMaterialStatus(material.id, 'error', error.message);
        }
    }
    async createProcessingTasks(materialId) {
        const taskTypes = [
            'text_extraction',
            'content_analysis',
            'embedding_generation'
        ];
        const tasks = [];
        for (const type of taskTypes) {
            const { data, error } = await supabase_1.supabase
                .from('processing_tasks')
                .insert({
                material_id: materialId,
                task_type: type,
                status: 'pending',
                progress: 0,
            })
                .select()
                .single();
            if (error)
                throw error;
            tasks.push(data);
        }
        return tasks;
    }
    async startProcessingPipeline(material, tasks) {
        // 1. Extract text
        const textTask = tasks.find(t => t.task_type === 'text_extraction');
        if (!textTask)
            throw new Error('Text extraction task not found');
        await this.updateTaskStatus(textTask.id, 'processing', 0);
        const extractedText = await this.extractText(material);
        await this.updateTaskStatus(textTask.id, 'completed', 100, { content: extractedText });
        // 2. Analyze content
        const analysisTask = tasks.find(t => t.task_type === 'content_analysis');
        if (!analysisTask)
            throw new Error('Content analysis task not found');
        await this.updateTaskStatus(analysisTask.id, 'processing', 0);
        const analysis = await this.analyzeContent(extractedText);
        await this.updateTaskStatus(analysisTask.id, 'completed', 100, analysis);
        // 3. Generate embeddings
        const embeddingTask = tasks.find(t => t.task_type === 'embedding_generation');
        if (!embeddingTask)
            throw new Error('Embedding generation task not found');
        await this.updateTaskStatus(embeddingTask.id, 'processing', 0);
        const embeddings = await this.generateEmbeddings(extractedText);
        await this.updateTaskStatus(embeddingTask.id, 'completed', 100, { embeddings });
        // Update material with processed results
        await this.updateMaterialWithResults(material.id, {
            content: extractedText,
            ...analysis,
            embeddings,
        });
    }
    async retryOperation(operation, taskId, description) {
        let lastError;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt}/${MAX_RETRIES} failed for ${description}:`, error);
                if (attempt < MAX_RETRIES) {
                    await this.updateTaskStatus(taskId, 'processing', ((attempt - 1) / MAX_RETRIES) * 100, null, error.message);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
                }
            }
        }
        throw lastError;
    }
    async extractText(material) {
        // Use Claude's vision capabilities for PDFs and images
        const response = await this.retryOperation(async () => anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 4000,
            messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Extract and format the text content from this material. Preserve the structure and formatting.',
                        },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: material.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
                                data: material.content,
                            },
                        },
                    ],
                }],
        }), material.id, 'text extraction');
        return response.content[0].text;
    }
    async analyzeContent(content) {
        const response = await this.retryOperation(async () => anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 2000,
            messages: [{
                    role: 'user',
                    content: `Analyze this aviation study material and provide:
          1. Main topics covered
          2. A concise summary
          3. Key learning points
          4. Difficulty level (beginner/intermediate/advanced)
          5. Prerequisites if any
          6. Related topics

          Content: ${content}

          Format the response as a JSON object with these fields:
          topics, summary, key_points, difficulty_level, prerequisites, related_topics`,
                }],
        }), content.substring(0, 20) + '...', 'content analysis');
        try {
            return JSON.parse(response.content[0].text);
        }
        catch (error) {
            throw new Error(`Failed to parse analysis response: ${error.message}`);
        }
    }
    async generateEmbeddings(content) {
        // Split content into chunks
        const chunks = this.splitIntoChunks(content);
        const embeddings = [];
        for (const chunk of chunks) {
            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1000,
                messages: [{
                        role: 'user',
                        content: `Generate a semantic embedding vector for this text: ${chunk}`,
                    }],
            });
            // Parse the embedding vector from response
            const vector = JSON.parse(response.content[0].text);
            embeddings.push(...vector);
        }
        return embeddings;
    }
    splitIntoChunks(text, maxChunkSize = 2000) {
        const words = text.split(/\s+/);
        const chunks = [];
        let currentChunk = '';
        for (const word of words) {
            if ((currentChunk + ' ' + word).length > maxChunkSize) {
                chunks.push(currentChunk);
                currentChunk = word;
            }
            else {
                currentChunk = currentChunk ? currentChunk + ' ' + word : word;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        return chunks;
    }
    async updateTaskStatus(taskId, status, progress, result, error) {
        const { error: dbError } = await supabase_1.supabase
            .from('processing_tasks')
            .update({
            status,
            progress,
            result,
            error,
            updated_at: new Date().toISOString(),
        })
            .eq('id', taskId);
        if (dbError)
            throw dbError;
    }
    async updateMaterialStatus(materialId, status, errorMessage) {
        const { error } = await supabase_1.supabase
            .from('materials')
            .update({
            status,
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
        })
            .eq('id', materialId);
        if (error)
            throw error;
    }
    async updateMaterialWithResults(materialId, results) {
        const { error } = await supabase_1.supabase
            .from('materials')
            .update({
            content: results.content,
            topics: results.topics,
            processed_content: {
                summary: results.summary,
                key_points: results.key_points,
                difficulty_level: results.difficulty_level,
                prerequisites: results.prerequisites,
                related_topics: results.related_topics,
            },
            embeddings: results.embeddings,
            status: 'ready',
            updated_at: new Date().toISOString(),
        })
            .eq('id', materialId);
        if (error)
            throw error;
    }
}
exports.default = ProcessingService;
