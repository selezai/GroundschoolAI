import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import { API_URL } from '@env';

const BACKGROUND_SYNC_TASK = 'background-sync';
const SYNC_INTERVAL = 15 * 60; // 15 minutes in seconds

interface SyncableContent {
  topics: any[];
  explanations: any[];
  progress: any[];
  quizzes: any[];
  lastSyncTimestamp: number;
}

interface SyncResult {
  success: boolean;
  error?: string;
  syncedData?: SyncableContent;
}

class SyncService {
  private static instance: SyncService;
  private isInitialized: boolean = false;
  private syncInProgress: boolean = false;

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Register background sync task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      const result = await this.performSync();
      return result.success ? BackgroundFetch.Result.NewData : BackgroundFetch.Result.Failed;
    });

    // Configure background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: SYNC_INTERVAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    this.isInitialized = true;
  }

  private async getHeaders(): Promise<{ [key: string]: string }> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async saveContentLocally(content: SyncableContent): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_content', JSON.stringify({
        ...content,
        lastSyncTimestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error saving content locally:', error);
      throw error;
    }
  }

  async getLocalContent(): Promise<SyncableContent | null> {
    try {
      const content = await AsyncStorage.getItem('offline_content');
      return content ? JSON.parse(content) : null;
    } catch (error) {
      console.error('Error getting local content:', error);
      return null;
    }
  }

  async performSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;

    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        return { success: false, error: 'No internet connection' };
      }

      const headers = await this.getHeaders();
      const localContent = await this.getLocalContent();
      const lastSync = localContent?.lastSyncTimestamp || 0;

      // Fetch all updated content since last sync
      const response = await axios.post(
        `${API_URL}/api/sync`,
        { lastSync },
        { headers }
      );

      const newContent: SyncableContent = response.data;

      // Merge local and remote content
      const mergedContent = this.mergeContent(localContent, newContent);

      // Save merged content locally
      await this.saveContentLocally(mergedContent);

      return { success: true, syncedData: mergedContent };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: 'Sync failed' };
    } finally {
      this.syncInProgress = false;
    }
  }

  private mergeContent(local: SyncableContent | null, remote: SyncableContent): SyncableContent {
    if (!local) return remote;

    return {
      topics: this.mergeArrays(local.topics, remote.topics, 'id'),
      explanations: this.mergeArrays(local.explanations, remote.explanations, 'id'),
      progress: this.mergeArrays(local.progress, remote.progress, 'id'),
      quizzes: this.mergeArrays(local.quizzes, remote.quizzes, 'id'),
      lastSyncTimestamp: Date.now(),
    };
  }

  private mergeArrays<T extends { id: string }>(local: T[], remote: T[], key: string): T[] {
    const merged = new Map<string, T>();
    
    // Add all local items
    local.forEach(item => merged.set(item[key], item));
    
    // Add or update with remote items
    remote.forEach(item => merged.set(item[key], item));
    
    return Array.from(merged.values());
  }

  async forceSyncContent(): Promise<SyncResult> {
    return this.performSync();
  }

  async clearLocalContent(): Promise<void> {
    try {
      await AsyncStorage.removeItem('offline_content');
    } catch (error) {
      console.error('Error clearing local content:', error);
      throw error;
    }
  }

  async isContentAvailableOffline(): Promise<boolean> {
    const content = await this.getLocalContent();
    return content !== null;
  }

  async getOfflineContent<T>(key: keyof SyncableContent): Promise<T[]> {
    const content = await this.getLocalContent();
    if (!content) {
      throw new Error('No offline content available');
    }
    return content[key] as T[];
  }
}

export default SyncService;
