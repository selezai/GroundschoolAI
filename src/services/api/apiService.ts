import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Topic, TopicProgress } from '../groundSchool/groundSchoolService';

interface APIResponse<T> {
  data: T;
  error?: string;
}

class APIService {
  private static instance: APIService;
  private api: AxiosInstance;
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: '@auth_token',
    TOPICS_CACHE: '@topics_cache',
    TOPIC_CACHE_PREFIX: '@topic_cache_',
  };

  private constructor() {
    this.api = axios.create({
      baseURL: this.API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.clearAuthToken();
          // You might want to trigger a logout action here
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
  }

  private async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, token);
  }

  private async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
  }

  // Cache management
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  private async setCachedData<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  // Authentication
  public async login(email: string, password: string): Promise<APIResponse<{ token: string }>> {
    try {
      const response = await this.api.post('/auth/login', { email, password });
      await this.setAuthToken(response.data.token);
      return { data: response.data };
    } catch (error: any) {
      return {
        data: { token: '' },
        error: error.response?.data?.error || 'Failed to login',
      };
    }
  }

  public async logout(): Promise<void> {
    await this.clearAuthToken();
  }

  // Topics
  public async getTopics(options: {
    category?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<APIResponse<Topic[]>> {
    try {
      const cacheKey = this.STORAGE_KEYS.TOPICS_CACHE + JSON.stringify(options);
      const cached = await this.getCachedData<Topic[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const response = await this.api.get('/topics', { params: options });
      await this.setCachedData(cacheKey, response.data);
      return { data: response.data };
    } catch (error: any) {
      return {
        data: [],
        error: error.response?.data?.error || 'Failed to fetch topics',
      };
    }
  }

  public async getTopicById(id: string): Promise<APIResponse<Topic>> {
    try {
      const cacheKey = this.STORAGE_KEYS.TOPIC_CACHE_PREFIX + id;
      const cached = await this.getCachedData<Topic>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const response = await this.api.get(`/topics/${id}`);
      await this.setCachedData(cacheKey, response.data);
      return { data: response.data };
    } catch (error: any) {
      return {
        data: {} as Topic,
        error: error.response?.data?.error || 'Failed to fetch topic',
      };
    }
  }

  public async generateTopic(category: string): Promise<APIResponse<Topic>> {
    try {
      const response = await this.api.post('/topics/generate', { category });
      return { data: response.data };
    } catch (error: any) {
      return {
        data: {} as Topic,
        error: error.response?.data?.error || 'Failed to generate topic',
      };
    }
  }

  public async getRelatedTopics(topicId: string): Promise<APIResponse<Topic[]>> {
    try {
      const cacheKey = `${this.STORAGE_KEYS.TOPIC_CACHE_PREFIX}${topicId}_related`;
      const cached = await this.getCachedData<Topic[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const response = await this.api.get(`/topics/${topicId}/related`);
      await this.setCachedData(cacheKey, response.data);
      return { data: response.data };
    } catch (error: any) {
      return {
        data: [],
        error: error.response?.data?.error || 'Failed to fetch related topics',
      };
    }
  }

  public async updateTopicProgress(
    topicId: string,
    updates: Partial<TopicProgress>
  ): Promise<APIResponse<TopicProgress>> {
    try {
      const response = await this.api.patch(`/topics/${topicId}`, updates);
      return { data: response.data };
    } catch (error: any) {
      return {
        data: {} as TopicProgress,
        error: error.response?.data?.error || 'Failed to update progress',
      };
    }
  }

  // Cache management
  public async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) =>
          key.startsWith(this.STORAGE_KEYS.TOPICS_CACHE) ||
          key.startsWith(this.STORAGE_KEYS.TOPIC_CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default APIService;
