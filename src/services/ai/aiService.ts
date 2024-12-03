import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '@env';

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

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
  materialId?: string;
}

export interface ProgressUpdate {
  userId: string;
  topicId: string;
  questionId?: string;
  action: 'viewed' | 'completed' | 'answered';
  correct?: boolean;
  timestamp: number;
}

export interface QuestionGenerationRequest {
  topic: string;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  previousQuestions?: string[];
  context?: string;
}

export interface InstructorRequest {
  question: string;
  context?: string;
  previousMessages?: ChatMessage[];
  materialId?: string;
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

  async generateQuestions(request: QuestionGenerationRequest): Promise<Question[]> {
    try {
      const prompt = `Generate ${request.count} aviation exam questions about ${request.topic}${
        request.difficulty ? ` at ${request.difficulty} difficulty` : ''
      }. Each question should be multiple choice with 4 options.
      
      ${request.context ? `Use this context: ${request.context}` : ''}
      
      Format each question as a JSON object with:
      - text: The question text
      - options: Array of 4 possible answers
      - correctAnswer: Index of correct answer (0-3)
      - explanation: Detailed explanation of the correct answer
      - topic: Main topic
      - subtopic: Specific subtopic
      - difficulty: "easy", "medium", or "hard"

      Return an array of these question objects.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: 0.7,
      });

      const questions = JSON.parse(response.content[0].text);

      // Cache the generated questions
      const cacheKey = `questions_${request.topic}_${request.difficulty || 'all'}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(questions));

      return questions;
    } catch (error) {
      // Try to fetch from cache if request fails
      const cacheKey = `questions_${request.topic}_${request.difficulty || 'all'}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  async generateExplanation(request: ExplanationRequest): Promise<string> {
    try {
      const prompt = `Explain the aviation topic: ${request.topic}
      
      ${request.context ? `Use this context: ${request.context}` : ''}
      
      Style: ${request.style || 'detailed'}
      
      ${request.previousExplanations ? 
        `Previous explanations to build upon: ${request.previousExplanations.join('\n')}` : ''}
      
      Provide a clear, comprehensive explanation suitable for a ground school student.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: 0.7,
      });

      const explanation = response.content[0].text;

      // Cache the explanation
      const cacheKey = `explanation_${request.topic}_${request.style || 'detailed'}`;
      await AsyncStorage.setItem(cacheKey, explanation);

      return explanation;
    } catch (error) {
      // Try to fetch from cache if request fails
      const cacheKey = `explanation_${request.topic}_${request.style || 'detailed'}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getChatResponse(request: InstructorRequest): Promise<ChatMessage> {
    try {
      const messages = request.previousMessages || [];
      const prompt = `You are an experienced flight instructor helping a student with ground school studies.
      
      Student question: ${request.question}
      
      ${request.context ? `Context from study materials: ${request.context}` : ''}
      
      Previous conversation:
      ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
      
      Provide a helpful, accurate response that helps the student understand the concept deeply.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: 0.7,
      });

      const newMessage: ChatMessage = {
        role: 'assistant',
        content: response.content[0].text,
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

  private async getCachedConversation(): Promise<ChatMessage[]> {
    const cached = await AsyncStorage.getItem('chat_history');
    return cached ? JSON.parse(cached) : [];
  }
}

export default AIService;
