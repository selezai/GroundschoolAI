import Queue from 'bull';
import { aiService } from './aiService';
import StudyMaterial from '../models/StudyMaterial';
import { extractTextFromPDF, extractTextFromImage } from './textExtraction';

// Create processing queue
const processingQueue = new Queue('study-material-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Process study materials
processingQueue.process(async (job) => {
  const { materialId } = job.data;
  
  try {
    // Get material
    const material = await StudyMaterial.findById(materialId);
    if (!material) {
      throw new Error('Study material not found');
    }

    // Update status
    material.processingStatus = 'processing';
    await material.save();

    // Extract text based on file type
    let extractedText;
    if (material.type === 'pdf') {
      extractedText = await extractTextFromPDF(material.fileUrl);
    } else {
      extractedText = await extractTextFromImage(material.fileUrl);
    }

    // Process with AI
    const { category, topics, summary } = await aiService.processStudyMaterial(extractedText);
    
    // Generate initial set of questions
    const questions = await aiService.generateQuestionsFromStudyMaterial(
      extractedText,
      10, // Default number of questions
      'medium' // Default difficulty
    );

    // Update material with processed data
    material.extractedText = extractedText;
    material.category = category;
    material.topics = topics;
    material.summary = summary;
    material.questions = questions;
    material.processingStatus = 'completed';
    await material.save();

    return { success: true };
  } catch (error: any) {
    // Update material with error
    const material = await StudyMaterial.findById(materialId);
    if (material) {
      material.processingStatus = 'failed';
      material.processingError = error.message;
      await material.save();
    }

    throw error;
  }
});

// Add retry logic
processingQueue.on('failed', async (job, error) => {
  if (job.attemptsMade < 3) { // Retry up to 3 times
    await job.retry();
  }
});

// Export functions for adding jobs to queue
export const queueStudyMaterialProcessing = async (materialId: string) => {
  return processingQueue.add(
    { materialId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds delay
      },
    }
  );
};

export const getProcessingProgress = async (jobId: string) => {
  const job = await processingQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = await job.progress();

  return {
    id: job.id,
    state,
    progress,
    failedReason: job.failedReason,
    attempts: job.attemptsMade,
  };
};
