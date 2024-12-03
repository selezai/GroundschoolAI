import { supabase } from '../supabaseClient';
import { extractTextFromPDF, extractTextFromImage } from '../utils/textExtraction';
import { processContent, generateEmbeddings } from '../ai/contentProcessor';
import { PostgrestError } from '@supabase/supabase-js';

export type MaterialType = 'pdf' | 'image' | 'text';
export type MaterialStatus = 'processing' | 'ready' | 'error';

export interface UploadedMaterial {
  id: string;
  userId: string;
  type: MaterialType;
  title: string;
  content: string;
  processedContent?: string;
  topics: string[];
  status: MaterialStatus;
  errorMessage?: string;
  uploadDate: Date;
  lastProcessed: Date;
}

interface ProcessingStage {
  stage: string;
  status: MaterialStatus;
  progress: number;
  message: string;
}

// Constants for batch processing
const CHUNK_SIZE = 4000; // Characters per chunk
const MAX_CONCURRENT_CHUNKS = 3;
const RATE_LIMIT_DELAY = 1000; // 1 second delay between batches

interface ProcessingStatus {
  stage: string;
  status: 'processing' | 'ready' | 'error';
  progress: number;
  message: string;
}

// Batch processing utilities
async function* createChunks(text: string): AsyncGenerator<string> {
  const words = text.split(/\s+/);
  let chunk = '';
  
  for (const word of words) {
    if ((chunk + ' ' + word).length > CHUNK_SIZE && chunk.length > 0) {
      yield chunk;
      chunk = word;
    } else {
      chunk = chunk.length === 0 ? word : chunk + ' ' + word;
    }
  }
  
  if (chunk.length > 0) {
    yield chunk;
  }
}

async function processChunkWithRateLimit<T>(
  chunk: string,
  processor: (text: string) => Promise<T>,
  delayMs: number
): Promise<T> {
  const result = await processor(chunk);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return result;
}

// Update the processing status in the database
async function updateProcessingStatus(
  materialId: string, 
  stage: string, 
  status: 'processing' | 'ready' | 'error',
  progress: number,
  message: string
): Promise<void> {
  const { error } = await supabase
    .from('material_processing')
    .upsert({
      material_id: materialId,
      stage,
      status,
      progress,
      message,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating processing status:', error);
    throw error;
  }
}

// Get the current processing status
export async function getProcessingStatus(materialId: string): Promise<ProcessingStatus[]> {
  const { data, error } = await supabase
    .from('material_processing')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(item => ({
    stage: item.stage,
    status: item.status,
    progress: item.progress,
    message: item.message,
  }));
}

// Process content in batches
async function processContentInBatches(
  materialId: string,
  content: string,
  processor: (text: string) => Promise<any>
): Promise<any[]> {
  const chunks = [];
  let processedChunks = 0;
  let totalChunks = 0;

  // First, count total chunks
  for await (const _ of createChunks(content)) {
    totalChunks++;
  }

  // Process chunks with concurrency control
  const chunkProcessor = async (chunk: string, index: number) => {
    const result = await processChunkWithRateLimit(chunk, processor, RATE_LIMIT_DELAY);
    processedChunks++;
    
    // Update progress
    const progress = processedChunks / totalChunks;
    await updateProcessingStatus(
      materialId,
      'content_processing',
      'processing',
      progress,
      `Processing chunk ${processedChunks} of ${totalChunks}`
    );
    
    return result;
  };

  // Process chunks with limited concurrency
  const processingChunks = [];
  for await (const chunk of createChunks(content)) {
    chunks.push(chunk);
    
    if (chunks.length >= MAX_CONCURRENT_CHUNKS) {
      const results = await Promise.all(
        chunks.map((c, i) => chunkProcessor(c, processedChunks + i))
      );
      processingChunks.push(...results);
      chunks.length = 0;
    }
  }

  // Process remaining chunks
  if (chunks.length > 0) {
    const results = await Promise.all(
      chunks.map((c, i) => chunkProcessor(c, processedChunks + i))
    );
    processingChunks.push(...results);
  }

  return processingChunks;
}

// Updated material processing function
export async function processUploadedMaterial(materialId: string, content: string): Promise<void> {
  try {
    // Initialize processing status
    await updateProcessingStatus(
      materialId,
      'content_processing',
      'processing',
      0,
      'Starting content processing'
    );

    // Process content in batches
    const processedChunks = await processContentInBatches(materialId, content, async (chunk) => {
      // Your existing content processing logic here
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Process this content chunk and extract key information: ${chunk}`,
        }],
      });
      return response.content;
    });

    // Generate embeddings in batches
    await updateProcessingStatus(
      materialId,
      'embedding_generation',
      'processing',
      0,
      'Starting embedding generation'
    );

    let embeddingCount = 0;
    const totalEmbeddings = processedChunks.length;

    for (let i = 0; i < processedChunks.length; i += MAX_CONCURRENT_CHUNKS) {
      const batch = processedChunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
      const embeddings = await Promise.all(
        batch.map(chunk => generateEmbedding(chunk))
      );

      // Store embeddings
      await storeEmbeddings(materialId, embeddings);
      
      embeddingCount += batch.length;
      await updateProcessingStatus(
        materialId,
        'embedding_generation',
        'processing',
        embeddingCount / totalEmbeddings,
        `Generated ${embeddingCount} of ${totalEmbeddings} embeddings`
      );

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    // Mark processing as complete
    await updateProcessingStatus(
      materialId,
      'embedding_generation',
      'ready',
      1,
      'Processing complete'
    );

  } catch (error) {
    console.error('Error processing material:', error);
    await updateProcessingStatus(
      materialId,
      'content_processing',
      'error',
      0,
      error.message || 'An error occurred during processing'
    );
    throw error;
  }
}

export const uploadMaterial = async (
  uri: string,
  type: MaterialType,
  title: string,
  userId: string
): Promise<UploadedMaterial> => {
  try {
    // 1. Create initial material record
    const { data: material, error: createError } = await supabase
      .from('materials')
      .insert([{
        user_id: userId,
        title,
        type,
        status: 'processing'
      }])
      .select()
      .single();

    if (createError) throw createError;

    // 2. Upload file to storage
    const filename = `${userId}/${material.id}-${title}`;
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filename, uri);

    if (uploadError) {
      await updateMaterialStatus(material.id, 'error', 'Failed to upload file');
      throw uploadError;
    }

    // 3. Update storage path
    await supabase
      .from('materials')
      .update({ storage_path: filename })
      .eq('id', material.id);

    // 4. Start processing pipeline
    processUploadedMaterial(material.id, uri, type);

    return material;
  } catch (error) {
    console.error('Error uploading material:', error);
    throw error;
  }
};

const updateMaterialStatus = async (
  materialId: string,
  status: MaterialStatus,
  errorMessage?: string
) => {
  const { error } = await supabase
    .from('materials')
    .update({
      status,
      error_message: errorMessage,
      last_processed_at: new Date().toISOString()
    })
    .eq('id', materialId);

  if (error) console.error('Error updating material status:', error);
};

export const getMaterials = async (userId: string): Promise<UploadedMaterial[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getMaterialById = async (materialId: string): Promise<UploadedMaterial> => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', materialId)
    .single();

  if (error) throw error;
  return data;
};

export const deleteMaterial = async (materialId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('user_id', userId);

  if (error) throw error;

  // Storage file will be deleted via cascade delete trigger
};
