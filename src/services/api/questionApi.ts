import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../auth';
import {
  Question,
  QuestionSet,
  QuizSession,
  UserStats,
} from '../../types/question';
import quizStorage from '../storage/quizStorage'; // Assuming quizStorage is imported from this location

const questionApi = {
  async getQuestionSets(): Promise<QuestionSet[]> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/questions/sets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getQuestionSet(setId: string): Promise<QuestionSet> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/questions/sets/${setId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getQuestions(setId: string): Promise<Question[]> {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/questions/sets/${setId}/questions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async startQuizSession(setId: string): Promise<QuizSession> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/questions/sessions`,
      { questionSetId: setId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: {
      selectedOptionIndex: number;
      timeSpent: number;
    }
  ): Promise<{
    isCorrect: boolean;
    explanation: string;
    nextQuestionId?: string;
  }> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/questions/sessions/${sessionId}/answers`,
      {
        questionId,
        ...answer,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async completeQuizSession(sessionId: string): Promise<QuizSession> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/questions/sessions/${sessionId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getUserStats(): Promise<UserStats> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/questions/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getQuizSession(sessionId: string): Promise<QuizSession> {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/questions/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getRecommendedSets(): Promise<QuestionSet[]> {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/questions/sets/recommended`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getQuizReview(sessionId: string): Promise<{
    questions: Array<Question & {
      userAnswer: {
        selectedOptionIndex: number;
        timeSpentSeconds: number;
        isCorrect: boolean;
      };
      explanation: string;
    }>;
  }> {
    try {
      // First try to get from local storage
      const offlineData = await quizStorage.getQuizReview(sessionId);
      if (offlineData) {
        return { questions: offlineData };
      }

      // If not in storage, fetch from API
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}/questions/sessions/${sessionId}/review`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Save to local storage for offline access
      await quizStorage.saveQuizReview(sessionId, response.data.questions);

      return response.data;
    } catch (error) {
      console.error('Error getting quiz review:', error);
      
      // If offline and data exists in storage, return that
      const offlineData = await quizStorage.getQuizReview(sessionId);
      if (offlineData) {
        return { questions: offlineData };
      }
      
      throw error;
    }
  },
};

export default questionApi;
