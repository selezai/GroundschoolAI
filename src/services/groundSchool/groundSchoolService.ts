import AsyncStorage from '@react-native-async-storage/async-storage';
import AIService from '../ai/aiService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabaseClient';

type Topic = Database['public']['Tables']['topics']['Row'];

export interface TopicProgress {
  topicId: string;
  userId: string;
  isCompleted: boolean;
  lastAccessed: number;
  timeSpent: number;
  notes: string[];
}

class GroundSchoolService {
  private static instance: GroundSchoolService;
  private readonly STORAGE_KEYS = {
    PROGRESS: '@topic_progress',
  };

  private constructor() {}

  public static getInstance(): GroundSchoolService {
    if (!GroundSchoolService.instance) {
      GroundSchoolService.instance = new GroundSchoolService();
    }
    return GroundSchoolService.instance;
  }

  // Get all topics
  async getAllTopics(): Promise<Topic[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching topics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  // Get a specific topic by ID
  async getTopicById(id: string): Promise<Topic | null> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Error fetching topic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting topic:', error);
      throw error;
    }
  }

  // Get topic progress
  async getTopicProgress(userId: string, topicId: string): Promise<TopicProgress | null> {
    try {
      const progressStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PROGRESS);
      const progress: TopicProgress[] = progressStr ? JSON.parse(progressStr) : [];
      return progress.find(p => p.userId === userId && p.topicId === topicId) || null;
    } catch (error) {
      console.error('Error getting topic progress:', error);
      throw error;
    }
  }

  // Update topic progress
  async updateTopicProgress(progress: TopicProgress): Promise<void> {
    try {
      const progressStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PROGRESS);
      let allProgress: TopicProgress[] = progressStr ? JSON.parse(progressStr) : [];
      
      const index = allProgress.findIndex(
        p => p.userId === progress.userId && p.topicId === progress.topicId
      );

      if (index !== -1) {
        allProgress[index] = progress;
      } else {
        allProgress.push(progress);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  }

  // Get all progress for a user
  async getAllProgressForUser(userId: string): Promise<TopicProgress[]> {
    try {
      const progressStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PROGRESS);
      const progress: TopicProgress[] = progressStr ? JSON.parse(progressStr) : [];
      return progress.filter(p => p.userId === userId);
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Generate study materials using AI
  async generateStudyMaterials(topic: Topic): Promise<string> {
    try {
      const aiService = new AIService();
      return await aiService.generateStudyMaterial(topic.name, topic.description || '');
    } catch (error) {
      console.error('Error generating study materials:', error);
      throw error;
    }
  }
}

export const groundSchoolService = GroundSchoolService.getInstance();
