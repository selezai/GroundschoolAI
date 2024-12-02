import AsyncStorage from '@react-native-async-storage/async-storage';
import AIService from '../ai/aiService';

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  relatedTopics: string[];
  tags: string[];
}

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
    TOPICS: '@ground_school_topics',
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
      const topicsStr = await AsyncStorage.getItem(this.STORAGE_KEYS.TOPICS);
      return topicsStr ? JSON.parse(topicsStr) : [];
    } catch (error) {
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  // Get topics by category
  async getTopicsByCategory(category: string): Promise<Topic[]> {
    try {
      const allTopics = await this.getAllTopics();
      return allTopics.filter(topic => topic.category === category);
    } catch (error) {
      console.error('Error getting topics by category:', error);
      throw error;
    }
  }

  // Get topic by ID
  async getTopicById(topicId: string): Promise<Topic | null> {
    try {
      const topics = await this.getAllTopics();
      return topics.find(topic => topic.id === topicId) || null;
    } catch (error) {
      console.error('Error getting topic by ID:', error);
      throw error;
    }
  }

  // Get recommended topics based on user progress and preferences
  async getRecommendedTopics(userId: string): Promise<Topic[]> {
    try {
      const [allTopics, progress] = await Promise.all([
        this.getAllTopics(),
        this.getUserProgress(userId),
      ]);

      // Get incomplete topics
      const incompleteTags = new Set<string>();
      const completedTopicIds = new Set(
        progress
          .filter(p => p.isCompleted)
          .map(p => p.topicId)
      );

      // Collect tags from completed topics
      allTopics
        .filter(topic => completedTopicIds.has(topic.id))
        .forEach(topic => topic.tags.forEach(tag => incompleteTags.add(tag)));

      // Find topics with similar tags that aren't completed
      return allTopics
        .filter(topic => !completedTopicIds.has(topic.id))
        .sort((a, b) => {
          const aMatchCount = a.tags.filter(tag => incompleteTags.has(tag)).length;
          const bMatchCount = b.tags.filter(tag => incompleteTags.has(tag)).length;
          return bMatchCount - aMatchCount;
        })
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting recommended topics:', error);
      throw error;
    }
  }

  // Get user progress for all topics
  async getUserProgress(userId: string): Promise<TopicProgress[]> {
    try {
      const progressStr = await AsyncStorage.getItem(`${this.STORAGE_KEYS.PROGRESS}_${userId}`);
      return progressStr ? JSON.parse(progressStr) : [];
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Update topic progress
  async updateTopicProgress(userId: string, topicId: string, updates: Partial<TopicProgress>): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      const existingProgress = progress.find(p => p.topicId === topicId);
      
      if (existingProgress) {
        Object.assign(existingProgress, updates);
      } else {
        progress.push({
          userId,
          topicId,
          isCompleted: false,
          lastAccessed: Date.now(),
          timeSpent: 0,
          notes: [],
          ...updates,
        });
      }

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.PROGRESS}_${userId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  }

  // Add note to topic
  async addNoteToTopic(userId: string, topicId: string, note: string): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      const topicProgress = progress.find(p => p.topicId === topicId);

      if (topicProgress) {
        topicProgress.notes.push(note);
      } else {
        progress.push({
          userId,
          topicId,
          isCompleted: false,
          lastAccessed: Date.now(),
          timeSpent: 0,
          notes: [note],
        });
      }

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.PROGRESS}_${userId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  // Get simplified explanation using AI
  async getSimplifiedExplanation(content: string): Promise<string> {
    try {
      const aiService = AIService.getInstance();
      return await aiService.generateSimplifiedExplanation(content);
    } catch (error) {
      console.error('Error getting simplified explanation:', error);
      throw error;
    }
  }

  // Get related topics
  async getRelatedTopics(topicId: string): Promise<Topic[]> {
    try {
      const allTopics = await this.getAllTopics();
      const currentTopic = allTopics.find(t => t.id === topicId);

      if (!currentTopic) {
        throw new Error('Topic not found');
      }

      // Find topics with matching tags or category
      return allTopics
        .filter(topic => 
          topic.id !== topicId && (
            topic.category === currentTopic.category ||
            topic.tags.some(tag => currentTopic.tags.includes(tag))
          )
        )
        .sort((a, b) => {
          const aMatchCount = a.tags.filter(tag => currentTopic.tags.includes(tag)).length;
          const bMatchCount = b.tags.filter(tag => currentTopic.tags.includes(tag)).length;
          return bMatchCount - aMatchCount;
        })
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting related topics:', error);
      throw error;
    }
  }
}
