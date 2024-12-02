import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subtopic?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ExplanationRequest {
  topic: string;
  context?: string;
  style?: 'simple' | 'detailed' | 'example-based';
  previousExplanations?: string[];
}

export interface ProgressUpdate {
  userId: string;
  topicId: string;
  questionId?: string;
  action: 'viewed' | 'completed' | 'answered';
  correct?: boolean;
  timestamp: number;
}

class AIService {
  private static instance: AIService;
  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async getHeaders(): Promise<{ [key: string]: string }> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async generateQuestions(
    topic: string,
    count: number = 5,
    difficulty?: 'easy' | 'medium' | 'hard',
    previousQuestions: string[] = []
  ): Promise<Question[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/ai/questions/generate`,
        {
          topic,
          count,
          difficulty,
          previousQuestions,
        },
        { headers }
      );

      // Cache the generated questions
      const cacheKey = `questions_${topic}_${difficulty || 'all'}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data.questions));

      return response.data.questions;
    } catch (error) {
      // Try to fetch from cache if request fails
      const cacheKey = `questions_${topic}_${difficulty || 'all'}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  async generateExplanation(request: ExplanationRequest): Promise<string> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/ai/explanations/generate`,
        request,
        { headers }
      );

      // Cache the explanation
      const cacheKey = `explanation_${request.topic}_${request.style || 'simple'}`;
      await AsyncStorage.setItem(cacheKey, response.data.explanation);

      return response.data.explanation;
    } catch (error) {
      // Try to fetch from cache if request fails
      const cacheKey = `explanation_${request.topic}_${request.style || 'simple'}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getChatResponse(
    messages: ChatMessage[],
    context?: string
  ): Promise<ChatMessage> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${API_URL}/api/ai/chat/response`,
        {
          messages,
          context,
        },
        { headers }
      );

      const newMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: Date.now(),
      };

      // Cache the conversation
      const conversationCache = await this.getCachedConversation();
      conversationCache.push(newMessage);
      await AsyncStorage.setItem('chat_history', JSON.stringify(conversationCache));

      return newMessage;
    } catch (error) {
      throw error;
    }
  }

  private async getCachedConversation(): Promise<ChatMessage[]> {
    const cached = await AsyncStorage.getItem('chat_history');
    return cached ? JSON.parse(cached) : [];
  }

  async updateProgress(update: ProgressUpdate): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.post(
        `${API_URL}/api/progress/update`,
        update,
        { headers }
      );

      // Cache progress update locally
      const cacheKey = `progress_${update.userId}_${update.topicId}`;
      const cachedUpdates = await this.getCachedProgressUpdates(cacheKey);
      cachedUpdates.push(update);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedUpdates));
    } catch (error) {
      // Store failed update for later sync
      const pendingUpdates = await this.getPendingProgressUpdates();
      pendingUpdates.push(update);
      await AsyncStorage.setItem('pending_progress_updates', JSON.stringify(pendingUpdates));
    }
  }

  private async getCachedProgressUpdates(cacheKey: string): Promise<ProgressUpdate[]> {
    const cached = await AsyncStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }

  private async getPendingProgressUpdates(): Promise<ProgressUpdate[]> {
    const pending = await AsyncStorage.getItem('pending_progress_updates');
    return pending ? JSON.parse(pending) : [];
  }

  async syncPendingProgressUpdates(): Promise<void> {
    const pendingUpdates = await this.getPendingProgressUpdates();
    if (pendingUpdates.length === 0) return;

    const headers = await this.getHeaders();
    try {
      await axios.post(
        `${API_URL}/api/progress/batch-update`,
        { updates: pendingUpdates },
        { headers }
      );
      await AsyncStorage.removeItem('pending_progress_updates');
    } catch (error) {
      console.error('Failed to sync pending progress updates:', error);
    }
  }

  async getProgressSummary(userId: string, topicId?: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${API_URL}/api/progress/summary/${userId}${topicId ? `/${topicId}` : ''}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      // Return cached summary if available
      const cacheKey = `progress_summary_${userId}${topicId ? `_${topicId}` : ''}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }
}

export default AIService;
