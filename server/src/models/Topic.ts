import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  description: string;
  category: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: Date;
  relatedTopics: string[];
  tags: string[];
}

const TopicSchema = new Schema<ITopic>({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
    index: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  relatedTopics: [{
    type: Schema.Types.ObjectId,
    ref: 'Topic',
  }],
  tags: [{
    type: String,
    index: true,
  }],
});

// Add text indexes for search
TopicSchema.index({
  title: 'text',
  description: 'text',
  content: 'text',
  tags: 'text',
});

export default mongoose.model<ITopic>('Topic', TopicSchema);
