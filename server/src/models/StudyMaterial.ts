import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyMaterial extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'pdf' | 'image';
  fileId: string;
  extractedText?: string;
  category?: string;
  topics?: string[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  questions?: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags?: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterial>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'image'],
    required: true
  },
  fileId: {
    type: String,
    required: true
  },
  extractedText: String,
  category: String,
  topics: [String],
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    tags: [String]
  }]
}, {
  timestamps: true
});

export default mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);
