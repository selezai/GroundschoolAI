import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question } from '../../types/question';

const STORAGE_KEYS = {
  QUIZ_REVIEWS: '@quiz_reviews',
  QUIZ_SESSIONS: '@quiz_sessions',
};

interface StoredQuizReview {
  sessionId: string;
  timestamp: number;
  questions: Array<Question & {
    userAnswer: {
      selectedOptionIndex: number;
      timeSpentSeconds: number;
      isCorrect: boolean;
    };
    explanation: string;
  }>;
}

const quizStorage = {
  async saveQuizReview(sessionId: string, reviewData: StoredQuizReview['questions']): Promise<void> {
    try {
      // Get existing reviews
      const existingReviews = await this.getStoredReviews();
      
      // Add new review
      const newReview: StoredQuizReview = {
        sessionId,
        timestamp: Date.now(),
        questions: reviewData,
      };
      
      existingReviews.push(newReview);
      
      // Keep only the last 10 reviews to manage storage space
      const recentReviews = existingReviews.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
      
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_REVIEWS, JSON.stringify(recentReviews));
    } catch (error) {
      console.error('Error saving quiz review:', error);
      throw error;
    }
  },

  async getQuizReview(sessionId: string): Promise<StoredQuizReview['questions'] | null> {
    try {
      const reviews = await this.getStoredReviews();
      const review = reviews.find(r => r.sessionId === sessionId);
      return review ? review.questions : null;
    } catch (error) {
      console.error('Error getting quiz review:', error);
      throw error;
    }
  },

  async getAllQuizReviews(): Promise<StoredQuizReview[]> {
    return this.getStoredReviews();
  },

  private async getStoredReviews(): Promise<StoredQuizReview[]> {
    try {
      const storedReviews = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_REVIEWS);
      return storedReviews ? JSON.parse(storedReviews) : [];
    } catch (error) {
      console.error('Error getting stored reviews:', error);
      return [];
    }
  },

  async clearAllReviews(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEWS);
    } catch (error) {
      console.error('Error clearing reviews:', error);
      throw error;
    }
  },
};

export default quizStorage;
