export type SubjectCategory = 
  | 'Air Law'
  | 'Aircraft Technical Knowledge'
  | 'Flight Performance and Planning'
  | 'Human Performance'
  | 'Meteorology'
  | 'Navigation'
  | 'Operational Procedures'
  | 'Principles of Flight'
  | 'Radio Telephony'
  | 'General Navigation';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  category: SubjectCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  diagram?: {
    url: string;
    caption: string;
    type: 'image' | 'chart' | 'graph';
  };
  sourceReference?: {
    materialId: string;
    pageNumber?: number;
    section?: string;
  };
}

export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  category: SubjectCategory;
  questionIds: string[];
  totalQuestions: number;
  completedBy?: number;
  averageScore?: number;
  passingScore: number; 
  timeLimit: number; 
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpent: number; 
  timestamp: string;
  confidence: 'high' | 'medium' | 'low'; 
}

export interface QuizSession {
  id: string;
  userId: string;
  questionSetId: string;
  startTime: string;
  endTime?: string;
  answers: UserAnswer[];
  score?: number;
  completed: boolean;
  timeRemaining?: number; 
  isPaused?: boolean;
}

export interface QuizProgress {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  timeSpent: number;
  passingScore: number;
  isPassing: boolean;
  remainingTime?: number;
}

export interface UserStats {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number;
  subjectPerformance: Record<SubjectCategory, {
    totalQuestions: number;
    correctAnswers: number;
    averageScore: number;
    lastAttempt?: string;
  }>;
  weakestSubjects: SubjectCategory[];
  strongestSubjects: SubjectCategory[];
  lastQuizDate?: string;
  streak: number;
  readinessPrediction?: number; 
}
