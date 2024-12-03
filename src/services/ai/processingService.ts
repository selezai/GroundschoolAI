import { supabase } from '../../lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '@env';
import { Material } from '../../hooks/useMaterials';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export interface ProcessingTask {
  id: string;
  material_id: string;
  task_type: 'text_extraction' | 'content_analysis' | 'embedding_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingResult {
  content: string;
  topics: string[];
  summary: string;
  key_points: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  related_topics?: string[];
  embeddings?: number[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ProcessingService {
  private static instance: ProcessingService;

  private constructor() {}

  public static getInstance(): ProcessingService {
    if (!ProcessingService.instance) {
      ProcessingService.instance = new ProcessingService();
    }
    return ProcessingService.instance;
  }

  async processNewMaterial(material: Material): Promise<void> {
    try {
      // Create processing tasks
      const tasks = await this.createProcessingTasks(material.id);
      
      // Start processing pipeline
      await this.startProcessingPipeline(material, tasks);
    } catch (error) {
      console.error('Error processing material:', error);
      await this.updateMaterialStatus(material.id, 'error', error.message);
    }
  }

  private async createProcessingTasks(materialId: string): Promise<ProcessingTask[]> {
    const taskTypes: ProcessingTask['task_type'][] = [
      'text_extraction',
      'content_analysis',
      'embedding_generation'
    ];

    const tasks: ProcessingTask[] = [];

    for (const type of taskTypes) {
      const { data, error } = await supabase
        .from('processing_tasks')
        .insert({
          material_id: materialId,
          task_type: type,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      tasks.push(data);
    }

    return tasks;
  }

  private async startProcessingPipeline(material: Material, tasks: ProcessingTask[]): Promise<void> {
    // 1. Extract text
    const textTask = tasks.find(t => t.task_type === 'text_extraction');
    if (!textTask) throw new Error('Text extraction task not found');

    await this.updateTaskStatus(textTask.id, 'processing', 0);
    const extractedText = await this.extractText(material);
    await this.updateTaskStatus(textTask.id, 'completed', 100, { content: extractedText });

    // 2. Analyze content
    const analysisTask = tasks.find(t => t.task_type === 'content_analysis');
    if (!analysisTask) throw new Error('Content analysis task not found');

    await this.updateTaskStatus(analysisTask.id, 'processing', 0);
    const analysis = await this.analyzeContent(extractedText);
    await this.updateTaskStatus(analysisTask.id, 'completed', 100, analysis);

    // 3. Generate embeddings
    const embeddingTask = tasks.find(t => t.task_type === 'embedding_generation');
    if (!embeddingTask) throw new Error('Embedding generation task not found');

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

  private async retryOperation<T>(
    operation: () => Promise<T>,
    taskId: string,
    description: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
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

  private async extractText(material: Material): Promise<string> {
    // Use Claude's vision capabilities for PDFs and images
    const response = await this.retryOperation(
      async () => anthropic.messages.create({
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
      }),
      material.id,
      'text extraction'
    );

    return response.content[0].text;
  }

  private async analyzeContent(content: string): Promise<Partial<ProcessingResult>> {
    const response = await this.retryOperation(
      async () => anthropic.messages.create({
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
      }),
      content.substring(0, 20) + '...',
      'content analysis'
    );

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      throw new Error(`Failed to parse analysis response: ${error.message}`);
    }
  }

  private async generateEmbeddings(content: string): Promise<number[]> {
    // Split content into chunks
    const chunks = this.splitIntoChunks(content);
    const embeddings: number[] = [];

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

  private splitIntoChunks(text: string, maxChunkSize: number = 2000): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if ((currentChunk + ' ' + word).length > maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + word : word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private async updateTaskStatus(
    taskId: string,
    status: ProcessingTask['status'],
    progress: number,
    result?: any,
    error?: string
  ): Promise<void> {
    const { error: dbError } = await supabase
      .from('processing_tasks')
      .update({
        status,
        progress,
        result,
        error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (dbError) throw dbError;
  }

  private async updateMaterialStatus(
    materialId: string,
    status: Material['status'],
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId);

    if (error) throw error;
  }

  private async updateMaterialWithResults(
    materialId: string,
    results: ProcessingResult
  ): Promise<void> {
    const { error } = await supabase
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

    if (error) throw error;
  }
}

export default ProcessingService;
