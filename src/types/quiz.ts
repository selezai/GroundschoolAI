import { Question, SubjectCategory } from './question';

export interface QuizSession {
  id: string;
  questionSetId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  status: 'in-progress' | 'completed' | 'abandoned';
  score?: number;
  timeSpentSeconds: number;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  timeSpentSeconds: number;
  passingScore: number;
  passed: boolean;
  categoryPerformance: {
    [key in SubjectCategory]?: {
      total: number;
      correct: number;
      score: number;
    };
  };
  weakAreas: string[];
  recommendedTopics: string[];
}

export interface QuizTimer {
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface QuizAnalytics {
  averageTimePerQuestion: number;
  quickestAnswer: number;
  slowestAnswer: number;
  skippedQuestions: number;
  changedAnswers: number;
  confidenceScore: number;
  timeManagementScore: number;
}
