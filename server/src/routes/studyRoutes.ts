import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import StudyMaterial from '../models/StudyMaterial';
import { aiService } from '../services/aiService';
import { uploadToStorage, getFileStream, deleteFile } from '../services/storageService';
import { queueStudyMaterialProcessing, getProcessingProgress } from '../services/processingQueue';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload study material
router.post('/upload', auth, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload file to GridFS
    const fileId = await uploadToStorage(req.file.buffer, req.file.originalname);

    // Create study material record
    const studyMaterial = await StudyMaterial.create({
      userId: req.user.userId,
      title: req.body.title || req.file.originalname,
      type: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      fileId,
      processingStatus: 'pending'
    });

    // Queue processing job
    const job = await queueStudyMaterialProcessing(studyMaterial._id);

    res.status(201).json({
      ...studyMaterial.toObject(),
      jobId: job.id
    });
  } catch (error) {
    console.error('Error uploading study material:', error);
    res.status(500).json({ message: 'Error uploading study material' });
  }
});

// Get all study materials for user
router.get('/materials', auth, async (req: any, res) => {
  try {
    const materials = await StudyMaterial.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching study materials:', error);
    res.status(500).json({ message: 'Error fetching study materials' });
  }
});

// Get single study material
router.get('/materials/:id', auth, async (req: any, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Error fetching study material:', error);
    res.status(500).json({ message: 'Error fetching study material' });
  }
});

// Stream file content
router.get('/materials/:id/content', auth, async (req: any, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const { stream, contentType } = await getFileStream(material.fileId);
    
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ message: 'Error streaming file' });
  }
});

// Delete study material
router.delete('/materials/:id', auth, async (req: any, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    // Delete file from GridFS
    await deleteFile(material.fileId);

    // Delete material record
    await material.deleteOne();

    res.json({ message: 'Study material deleted' });
  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({ message: 'Error deleting study material' });
  }
});

// Get processing status
router.get('/materials/:id/status', auth, async (req: any, res) => {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    // Get job progress if processing
    let progress = null;
    if (material.processingStatus === 'processing' && req.query.jobId) {
      progress = await getProcessingProgress(req.query.jobId);
    }

    res.json({
      status: material.processingStatus,
      error: material.processingError,
      progress
    });
  } catch (error) {
    console.error('Error fetching processing status:', error);
    res.status(500).json({ message: 'Error fetching processing status' });
  }
});

// Generate questions from material
router.post('/materials/:id/questions', auth, async (req: any, res) => {
  try {
    const { count = 10, difficulty } = req.body;
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    if (material.processingStatus !== 'completed') {
      return res.status(400).json({ message: 'Material processing not completed' });
    }

    // Generate questions using AI
    const questions = await aiService.generateQuestionsFromStudyMaterial(
      material.extractedText,
      count,
      difficulty
    );
    
    // Update material with new questions
    material.questions = questions;
    await material.save();

    res.json(questions);
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ message: 'Error generating questions' });
  }
});

export default router;
