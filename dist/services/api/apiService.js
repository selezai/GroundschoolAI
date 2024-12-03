"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
class APIService {
    constructor() {
        this.API_URL = 'http://localhost:3000/api';
        this.STORAGE_KEYS = {
            AUTH_TOKEN: '@auth_token',
            TOPICS_CACHE: '@topics_cache',
            TOPIC_CACHE_PREFIX: '@topic_cache_',
        };
        this.api = axios_1.default.create({
            baseURL: this.API_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Add request interceptor for authentication
        this.api.interceptors.request.use(async (config) => {
            const token = await this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // Add response interceptor for error handling
        this.api.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401) {
                await this.clearAuthToken();
                // You might want to trigger a logout action here
            }
            return Promise.reject(error);
        });
    }
    static getInstance() {
        if (!APIService.instance) {
            APIService.instance = new APIService();
        }
        return APIService.instance;
    }
    async getAuthToken() {
        return async_storage_1.default.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    }
    async setAuthToken(token) {
        await async_storage_1.default.setItem(this.STORAGE_KEYS.AUTH_TOKEN, token);
    }
    async clearAuthToken() {
        await async_storage_1.default.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
    }
    // Cache management
    async getCachedData(key) {
        try {
            const cached = await async_storage_1.default.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Check if cache is still valid (24 hours)
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    return data;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error reading from cache:', error);
            return null;
        }
    }
    async setCachedData(key, data) {
        try {
            await async_storage_1.default.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now(),
            }));
        }
        catch (error) {
            console.error('Error writing to cache:', error);
        }
    }
    // Authentication
    async login(email, password) {
        try {
            const response = await this.api.post('/auth/login', { email, password });
            await this.setAuthToken(response.data.token);
            return { data: response.data };
        }
        catch (error) {
            return {
                data: { token: '' },
                error: error.response?.data?.error || 'Failed to login',
            };
        }
    }
    async logout() {
        await this.clearAuthToken();
    }
    // Topics
    async getTopics(options) {
        try {
            const cacheKey = this.STORAGE_KEYS.TOPICS_CACHE + JSON.stringify(options);
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return { data: cached };
            }
            const response = await this.api.get('/topics', { params: options });
            await this.setCachedData(cacheKey, response.data);
            return { data: response.data };
        }
        catch (error) {
            return {
                data: [],
                error: error.response?.data?.error || 'Failed to fetch topics',
            };
        }
    }
    async getTopicById(id) {
        try {
            const cacheKey = this.STORAGE_KEYS.TOPIC_CACHE_PREFIX + id;
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return { data: cached };
            }
            const response = await this.api.get(`/topics/${id}`);
            await this.setCachedData(cacheKey, response.data);
            return { data: response.data };
        }
        catch (error) {
            return {
                data: {},
                error: error.response?.data?.error || 'Failed to fetch topic',
            };
        }
    }
    async generateTopic(category) {
        try {
            const response = await this.api.post('/topics/generate', { category });
            return { data: response.data };
        }
        catch (error) {
            return {
                data: {},
                error: error.response?.data?.error || 'Failed to generate topic',
            };
        }
    }
    async getRelatedTopics(topicId) {
        try {
            const cacheKey = `${this.STORAGE_KEYS.TOPIC_CACHE_PREFIX}${topicId}_related`;
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return { data: cached };
            }
            const response = await this.api.get(`/topics/${topicId}/related`);
            await this.setCachedData(cacheKey, response.data);
            return { data: response.data };
        }
        catch (error) {
            return {
                data: [],
                error: error.response?.data?.error || 'Failed to fetch related topics',
            };
        }
    }
    async updateTopicProgress(topicId, updates) {
        try {
            const response = await this.api.patch(`/topics/${topicId}`, updates);
            return { data: response.data };
        }
        catch (error) {
            return {
                data: {},
                error: error.response?.data?.error || 'Failed to update progress',
            };
        }
    }
    // Cache management
    async clearCache() {
        try {
            const keys = await async_storage_1.default.getAllKeys();
            const cacheKeys = keys.filter((key) => key.startsWith(this.STORAGE_KEYS.TOPICS_CACHE) ||
                key.startsWith(this.STORAGE_KEYS.TOPIC_CACHE_PREFIX));
            await async_storage_1.default.multiRemove(cacheKeys);
        }
        catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}
exports.default = APIService;
