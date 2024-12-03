"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
class OfflineStorage {
    constructor() {
        this.STORAGE_KEY = '@offline_content';
        this.MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB limit
    }
    static getInstance() {
        if (!OfflineStorage.instance) {
            OfflineStorage.instance = new OfflineStorage();
        }
        return OfflineStorage.instance;
    }
    async saveContent(content) {
        try {
            const existingContent = await this.getAllContent();
            const newContent = [...existingContent, content];
            // Check storage size
            const storageSize = await this.calculateStorageSize(newContent);
            if (storageSize > this.MAX_STORAGE_SIZE) {
                throw new Error('Storage limit exceeded');
            }
            await async_storage_1.default.setItem(this.STORAGE_KEY, JSON.stringify(newContent));
        }
        catch (error) {
            console.error('Error saving offline content:', error);
            throw error;
        }
    }
    async getContent(id) {
        try {
            const content = await this.getAllContent();
            return content.find(item => item.id === id) || null;
        }
        catch (error) {
            console.error('Error getting offline content:', error);
            throw error;
        }
    }
    async getAllContent() {
        try {
            const content = await async_storage_1.default.getItem(this.STORAGE_KEY);
            return content ? JSON.parse(content) : [];
        }
        catch (error) {
            console.error('Error getting all offline content:', error);
            throw error;
        }
    }
    async removeContent(id) {
        try {
            const content = await this.getAllContent();
            const updatedContent = content.filter(item => item.id !== id);
            await async_storage_1.default.setItem(this.STORAGE_KEY, JSON.stringify(updatedContent));
        }
        catch (error) {
            console.error('Error removing offline content:', error);
            throw error;
        }
    }
    async clearAllContent() {
        try {
            await async_storage_1.default.removeItem(this.STORAGE_KEY);
        }
        catch (error) {
            console.error('Error clearing offline content:', error);
            throw error;
        }
    }
    async calculateStorageSize(content) {
        const contentString = JSON.stringify(content);
        return new Blob([contentString]).size;
    }
    async getStorageUsage() {
        try {
            const content = await this.getAllContent();
            const used = await this.calculateStorageSize(content);
            return {
                used,
                total: this.MAX_STORAGE_SIZE,
                percentage: (used / this.MAX_STORAGE_SIZE) * 100,
            };
        }
        catch (error) {
            console.error('Error calculating storage usage:', error);
            throw error;
        }
    }
}
exports.default = OfflineStorage;
