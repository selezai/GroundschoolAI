// Authentication Types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  progress: number;
}

// Study Material Types
export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'chapter' | 'quiz' | 'practice';
  content: any;
  estimatedTime: number;
  prerequisites: string[];
}

export interface Progress {
  materialId: string;
  completed: boolean;
  score?: number;
  lastAccessed: Date;
  timeSpent: number;
}

// Quiz Types
export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface Answer {
  questionId: string;
  answer: string | string[];
}

export interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  feedback: string[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  date: Date;
  timeSpent: number;
}

// Progress Types
export interface OverallProgress {
  completedTopics: number;
  totalTopics: number;
  averageScore: number;
  timeSpent: number;
  strengths: string[];
  weaknesses: string[];
}

export interface TopicProgress {
  id: string;
  title: string;
  progress: number;
  lastStudied: Date;
  mastery: 'none' | 'basic' | 'intermediate' | 'advanced';
}

export interface StudyRecommendation {
  materialId: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// User Profile Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences: {
    notifications: boolean;
    studyReminders: boolean;
    preferredStudyTime: string[];
  };
}

export interface StudyStatistics {
  totalStudyTime: number;
  averageSessionLength: number;
  completedMaterials: number;
  averageScore: number;
  studyStreak: number;
}
