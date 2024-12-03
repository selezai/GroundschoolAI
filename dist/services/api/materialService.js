"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.getMaterialById = exports.getMaterials = exports.uploadMaterial = void 0;
exports.getProcessingStatus = getProcessingStatus;
exports.processUploadedMaterial = processUploadedMaterial;
const supabaseClient_1 = require("../supabaseClient");
// Constants for batch processing
const CHUNK_SIZE = 4000; // Characters per chunk
const MAX_CONCURRENT_CHUNKS = 3;
const RATE_LIMIT_DELAY = 1000; // 1 second delay between batches
// Batch processing utilities
async function* createChunks(text) {
    const words = text.split(/\s+/);
    let chunk = '';
    for (const word of words) {
        if ((chunk + ' ' + word).length > CHUNK_SIZE && chunk.length > 0) {
            yield chunk;
            chunk = word;
        }
        else {
            chunk = chunk.length === 0 ? word : chunk + ' ' + word;
        }
    }
    if (chunk.length > 0) {
        yield chunk;
    }
}
async function processChunkWithRateLimit(chunk, processor, delayMs) {
    const result = await processor(chunk);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return result;
}
// Update the processing status in the database
async function updateProcessingStatus(materialId, stage, status, progress, message) {
    const { error } = await supabaseClient_1.supabase
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
async function getProcessingStatus(materialId) {
    const { data, error } = await supabaseClient_1.supabase
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
async function processContentInBatches(materialId, content, processor) {
    const chunks = [];
    let processedChunks = 0;
    let totalChunks = 0;
    // First, count total chunks
    for await (const _ of createChunks(content)) {
        totalChunks++;
    }
    // Process chunks with concurrency control
    const chunkProcessor = async (chunk, index) => {
        const result = await processChunkWithRateLimit(chunk, processor, RATE_LIMIT_DELAY);
        processedChunks++;
        // Update progress
        const progress = processedChunks / totalChunks;
        await updateProcessingStatus(materialId, 'content_processing', 'processing', progress, `Processing chunk ${processedChunks} of ${totalChunks}`);
        return result;
    };
    // Process chunks with limited concurrency
    const processingChunks = [];
    for await (const chunk of createChunks(content)) {
        chunks.push(chunk);
        if (chunks.length >= MAX_CONCURRENT_CHUNKS) {
            const results = await Promise.all(chunks.map((c, i) => chunkProcessor(c, processedChunks + i)));
            processingChunks.push(...results);
            chunks.length = 0;
        }
    }
    // Process remaining chunks
    if (chunks.length > 0) {
        const results = await Promise.all(chunks.map((c, i) => chunkProcessor(c, processedChunks + i)));
        processingChunks.push(...results);
    }
    return processingChunks;
}
// Updated material processing function
async function processUploadedMaterial(materialId, content) {
    try {
        // Initialize processing status
        await updateProcessingStatus(materialId, 'content_processing', 'processing', 0, 'Starting content processing');
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
        await updateProcessingStatus(materialId, 'embedding_generation', 'processing', 0, 'Starting embedding generation');
        let embeddingCount = 0;
        const totalEmbeddings = processedChunks.length;
        for (let i = 0; i < processedChunks.length; i += MAX_CONCURRENT_CHUNKS) {
            const batch = processedChunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
            const embeddings = await Promise.all(batch.map(chunk => generateEmbedding(chunk)));
            // Store embeddings
            await storeEmbeddings(materialId, embeddings);
            embeddingCount += batch.length;
            await updateProcessingStatus(materialId, 'embedding_generation', 'processing', embeddingCount / totalEmbeddings, `Generated ${embeddingCount} of ${totalEmbeddings} embeddings`);
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
        // Mark processing as complete
        await updateProcessingStatus(materialId, 'embedding_generation', 'ready', 1, 'Processing complete');
    }
    catch (error) {
        console.error('Error processing material:', error);
        await updateProcessingStatus(materialId, 'content_processing', 'error', 0, error.message || 'An error occurred during processing');
        throw error;
    }
}
const uploadMaterial = async (uri, type, title, userId) => {
    try {
        // 1. Create initial material record
        const { data: material, error: createError } = await supabaseClient_1.supabase
            .from('materials')
            .insert([{
                user_id: userId,
                title,
                type,
                status: 'processing'
            }])
            .select()
            .single();
        if (createError)
            throw createError;
        // 2. Upload file to storage
        const filename = `${userId}/${material.id}-${title}`;
        const { error: uploadError } = await supabaseClient_1.supabase.storage
            .from('materials')
            .upload(filename, uri);
        if (uploadError) {
            await updateMaterialStatus(material.id, 'error', 'Failed to upload file');
            throw uploadError;
        }
        // 3. Update storage path
        await supabaseClient_1.supabase
            .from('materials')
            .update({ storage_path: filename })
            .eq('id', material.id);
        // 4. Start processing pipeline
        processUploadedMaterial(material.id, uri, type);
        return material;
    }
    catch (error) {
        console.error('Error uploading material:', error);
        throw error;
    }
};
exports.uploadMaterial = uploadMaterial;
const updateMaterialStatus = async (materialId, status, errorMessage) => {
    const { error } = await supabaseClient_1.supabase
        .from('materials')
        .update({
        status,
        error_message: errorMessage,
        last_processed_at: new Date().toISOString()
    })
        .eq('id', materialId);
    if (error)
        console.error('Error updating material status:', error);
};
const getMaterials = async (userId) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('materials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data;
};
exports.getMaterials = getMaterials;
const getMaterialById = async (materialId) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();
    if (error)
        throw error;
    return data;
};
exports.getMaterialById = getMaterialById;
const deleteMaterial = async (materialId, userId) => {
    const { error } = await supabaseClient_1.supabase
        .from('materials')
        .delete()
        .eq('id', materialId)
        .eq('user_id', userId);
    if (error)
        throw error;
    // Storage file will be deleted via cascade delete trigger
};
exports.deleteMaterial = deleteMaterial;
