import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Topic {
  id: string;
  title: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface Explanation {
  id: string;
  topicId: string;
  content: string;
  examples: string[];
  diagrams?: string[];
  lastUpdated: Date;
}

interface ExplanationRequest {
  topicId: string;
  context: string;
}

interface ExplanationResponse {
  content: string;
  metadata: {
    style: string;
    timestamp: string;
  };
}

class GroundSchoolService {
  private static instance: GroundSchoolService;

  private constructor() {}

  static getInstance(): GroundSchoolService {
    if (!GroundSchoolService.instance) {
      GroundSchoolService.instance = new GroundSchoolService();
    }
    return GroundSchoolService.instance;
  }

  private async getHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all available topics
  async getTopics(): Promise<Topic[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${API_URL}/api/groundschool/topics`, { headers });
      return response.data.topics;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }

  // Get topics by category
  async getTopicsByCategory(category: string): Promise<Topic[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${API_URL}/api/groundschool/topics/category/${category}`,
        { headers }
      );
      return response.data.topics;
    } catch (error) {
      console.error('Error fetching topics by category:', error);
      throw error;
    }
  }

  // Get explanation for a specific topic
  async getExplanation(topicId: string): Promise<Explanation> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${API_URL}/api/groundschool/explanations/${topicId}`,
        { headers }
      );
      return response.data.explanation;
    } catch (error) {
      console.error('Error fetching explanation:', error);
      throw error;
    }
  }

  // Request AI to generate a new explanation
  async generateExplanation(topicId: string, context: string): Promise<ExplanationResponse> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post<ExplanationResponse>(
        `${API_URL}/api/groundschool/explanations/generate`,
        {
          topicId,
          context,
        },
        { headers }
      );

      // Cache the generated explanation
      await AsyncStorage.setItem(
        `explanation_${topicId}_${context}`,
        JSON.stringify(response.data)
      );

      return response.data;
    } catch (error) {
      // Try to fetch from cache if offline
      const cachedData = await AsyncStorage.getItem(`explanation_${topicId}_${context}`);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  // Save explanation for offline access
  async saveExplanationOffline(explanation: Explanation): Promise<void> {
    try {
      const savedExplanations = await AsyncStorage.getItem('offlineExplanations');
      const explanations = savedExplanations ? JSON.parse(savedExplanations) : {};
      
      explanations[explanation.topicId] = {
        ...explanation,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('offlineExplanations', JSON.stringify(explanations));
    } catch (error) {
      console.error('Error saving explanation offline:', error);
      throw error;
    }
  }

  // Get offline explanation
  async getOfflineExplanation(topicId: string): Promise<Explanation | null> {
    try {
      const savedExplanations = await AsyncStorage.getItem('offlineExplanations');
      if (!savedExplanations) return null;

      const explanations = JSON.parse(savedExplanations);
      return explanations[topicId] || null;
    } catch (error) {
      console.error('Error getting offline explanation:', error);
      return null;
    }
  }

  // Track user progress
  async trackProgress(topicId: string, completed: boolean): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.post(
        `${API_URL}/api/groundschool/progress`,
        {
          topicId,
          completed,
          timestamp: new Date().toISOString(),
        },
        { headers }
      );
    } catch (error) {
      console.error('Error tracking progress:', error);
      // Store offline if request fails
      await this.saveProgressOffline(topicId, completed);
    }
  }

  // Save progress offline
  private async saveProgressOffline(topicId: string, completed: boolean): Promise<void> {
    try {
      const savedProgress = await AsyncStorage.getItem('offlineProgress');
      const progress = savedProgress ? JSON.parse(savedProgress) : {};
      
      progress[topicId] = {
        completed,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      await AsyncStorage.setItem('offlineProgress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress offline:', error);
    }
  }
}

export default GroundSchoolService.getInstance();
