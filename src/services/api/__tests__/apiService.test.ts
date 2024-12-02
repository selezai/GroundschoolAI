import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import APIService from '../apiService';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

describe('APIService', () => {
  let apiService: APIService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    apiService = APIService.getInstance();
  });

  describe('Authentication', () => {
    const mockToken = 'mock-token';
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';

    it('should login successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { token: mockToken } });

      const result = await apiService.login(mockEmail, mockPassword);

      expect(result).toEqual({ data: { token: mockToken } });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@auth_token', mockToken);
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      const result = await apiService.login(mockEmail, mockPassword);

      expect(result).toEqual({
        data: { token: '' },
        error: errorMessage,
      });
    });

    it('should logout and clear token', async () => {
      await apiService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
    });
  });

  describe('Topics', () => {
    const mockTopics = [
      { id: '1', title: 'Topic 1' },
      { id: '2', title: 'Topic 2' },
    ];

    it('should fetch topics successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTopics });

      const result = await apiService.getTopics({});

      expect(result).toEqual({ data: mockTopics });
    });

    it('should use cached topics when available', async () => {
      const mockCachedData = JSON.stringify({
        data: mockTopics,
        timestamp: Date.now(),
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockCachedData);

      const result = await apiService.getTopics({});

      expect(result).toEqual({ data: mockTopics });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch topic by id successfully', async () => {
      const mockTopic = mockTopics[0];
      mockedAxios.get.mockResolvedValueOnce({ data: mockTopic });

      const result = await apiService.getTopicById('1');

      expect(result).toEqual({ data: mockTopic });
    });

    it('should fetch related topics successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockTopics });

      const result = await apiService.getRelatedTopics('1');

      expect(result).toEqual({ data: mockTopics });
    });

    it('should update topic progress successfully', async () => {
      const mockProgress = { completed: true, score: 100 };
      mockedAxios.patch.mockResolvedValueOnce({ data: mockProgress });

      const result = await apiService.updateTopicProgress('1', mockProgress);

      expect(result).toEqual({ data: mockProgress });
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', async () => {
      const mockKeys = ['@topics_cache_1', '@topic_cache_2'];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce(mockKeys);

      await apiService.clearCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(mockKeys);
    });

    it('should handle cache clearing errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Cache clearing failed');
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValueOnce(error);

      await apiService.clearCache();

      expect(consoleError).toHaveBeenCalledWith('Error clearing cache:', error);
      consoleError.mockRestore();
    });
  });
});
