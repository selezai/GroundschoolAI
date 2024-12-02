export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  requiredProgress: number;
}

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  topics: string[];
  dailyGoalMinutes: number;
  weeklyGoalSessions: number;
  startDate: Date;
  endDate: Date;
  progress: number;
}

export interface StudyProgress {
  totalTimeSpent: number;
  sessionsCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  topicsCompleted: string[];
  streakDays: number;
  lastStudyDate?: Date;
}

export interface GameStats {
  currentLevel: number;
  experiencePoints: number;
  nextLevelThreshold: number;
  rank: string;
  streakCount: number;
  dailyGoalProgress: number;
}

export type StudyStrength = 'weak' | 'moderate' | 'strong';

export interface TopicMastery {
  topicId: string;
  strength: StudyStrength;
  lastPracticed?: Date;
  timeSpent: number;
  questionsAnswered: number;
  accuracy: number;
}
