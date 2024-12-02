import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import SyncService from '../services/sync/syncService';

interface UseOfflineContentResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  syncStatus: {
    lastSync: number | null;
    isSyncing: boolean;
  };
  forceSync: () => Promise<void>;
}

export function useOfflineContent<T>(contentType: 'topics' | 'explanations' | 'progress' | 'quizzes'): UseOfflineContentResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null as number | null,
    isSyncing: false,
  });

  const syncService = SyncService.getInstance();

  useEffect(() => {
    const initialize = async () => {
      await syncService.initialize();
    };
    initialize();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadContent();
  }, [contentType]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get content from local storage first
      const localContent = await syncService.getLocalContent();
      
      if (localContent) {
        setData(localContent[contentType]);
        setSyncStatus(prev => ({
          ...prev,
          lastSync: localContent.lastSyncTimestamp,
        }));
      }

      // If online, try to sync
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        await performSync();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load content'));
    } finally {
      setIsLoading(false);
    }
  };

  const performSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const result = await syncService.performSync();

      if (result.success && result.syncedData) {
        setData(result.syncedData[contentType]);
        setSyncStatus({
          lastSync: result.syncedData.lastSyncTimestamp,
          isSyncing: false,
        });
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync error:', err);
      // Don't set error if we have local data
      if (!data) {
        setError(err instanceof Error ? err : new Error('Sync failed'));
      }
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const forceSync = async () => {
    if (!isOffline) {
      await performSync();
    }
  };

  return {
    data,
    isLoading,
    error,
    isOffline,
    syncStatus,
    forceSync,
  };
}
