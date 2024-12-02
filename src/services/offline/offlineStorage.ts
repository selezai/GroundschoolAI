import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineContent {
  id: string;
  type: 'quiz' | 'lesson' | 'flashcard';
  title: string;
  content: any;
  lastUpdated: string;
}

class OfflineStorage {
  private static instance: OfflineStorage;
  private readonly STORAGE_KEY = '@offline_content';
  private readonly MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB limit

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  async saveContent(content: OfflineContent): Promise<void> {
    try {
      const existingContent = await this.getAllContent();
      const newContent = [...existingContent, content];
      
      // Check storage size
      const storageSize = await this.calculateStorageSize(newContent);
      if (storageSize > this.MAX_STORAGE_SIZE) {
        throw new Error('Storage limit exceeded');
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newContent));
    } catch (error) {
      console.error('Error saving offline content:', error);
      throw error;
    }
  }

  async getContent(id: string): Promise<OfflineContent | null> {
    try {
      const content = await this.getAllContent();
      return content.find(item => item.id === id) || null;
    } catch (error) {
      console.error('Error getting offline content:', error);
      throw error;
    }
  }

  async getAllContent(): Promise<OfflineContent[]> {
    try {
      const content = await AsyncStorage.getItem(this.STORAGE_KEY);
      return content ? JSON.parse(content) : [];
    } catch (error) {
      console.error('Error getting all offline content:', error);
      throw error;
    }
  }

  async removeContent(id: string): Promise<void> {
    try {
      const content = await this.getAllContent();
      const updatedContent = content.filter(item => item.id !== id);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedContent));
    } catch (error) {
      console.error('Error removing offline content:', error);
      throw error;
    }
  }

  async clearAllContent(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing offline content:', error);
      throw error;
    }
  }

  private async calculateStorageSize(content: OfflineContent[]): Promise<number> {
    const contentString = JSON.stringify(content);
    return new Blob([contentString]).size;
  }

  async getStorageUsage(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }> {
    try {
      const content = await this.getAllContent();
      const used = await this.calculateStorageSize(content);
      return {
        used,
        total: this.MAX_STORAGE_SIZE,
        percentage: (used / this.MAX_STORAGE_SIZE) * 100,
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      throw error;
    }
  }
}

export default OfflineStorage;
