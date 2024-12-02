import mongoose from 'mongoose';

export interface ISyncLog extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'full' | 'partial';
  status: 'pending' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  syncedData: {
    questions?: number;
    progress?: number;
    settings?: boolean;
  };
  error?: string;
}

const syncLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['full', 'partial'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  syncedData: {
    questions: Number,
    progress: Number,
    settings: Boolean,
  },
  error: {
    type: String,
  },
}, {
  timestamps: true,
});

export const SyncLog = mongoose.model<ISyncLog>('SyncLog', syncLogSchema);
