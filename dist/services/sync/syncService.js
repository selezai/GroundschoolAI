"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
const BackgroundFetch = __importStar(require("expo-background-fetch"));
const TaskManager = __importStar(require("expo-task-manager"));
const axios_1 = __importDefault(require("axios"));
const _env_1 = require("@env");
const BACKGROUND_SYNC_TASK = 'background-sync';
const SYNC_INTERVAL = 15 * 60; // 15 minutes in seconds
class SyncService {
    constructor() {
        this.isInitialized = false;
        this.syncInProgress = false;
    }
    static getInstance() {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
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
    async getHeaders() {
        const token = await async_storage_1.default.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    async saveContentLocally(content) {
        try {
            await async_storage_1.default.setItem('offline_content', JSON.stringify({
                ...content,
                lastSyncTimestamp: Date.now(),
            }));
        }
        catch (error) {
            console.error('Error saving content locally:', error);
            throw error;
        }
    }
    async getLocalContent() {
        try {
            const content = await async_storage_1.default.getItem('offline_content');
            return content ? JSON.parse(content) : null;
        }
        catch (error) {
            console.error('Error getting local content:', error);
            return null;
        }
    }
    async performSync() {
        if (this.syncInProgress) {
            return { success: false, error: 'Sync already in progress' };
        }
        this.syncInProgress = true;
        try {
            const networkState = await netinfo_1.default.fetch();
            if (!networkState.isConnected) {
                return { success: false, error: 'No internet connection' };
            }
            const headers = await this.getHeaders();
            const localContent = await this.getLocalContent();
            const lastSync = localContent?.lastSyncTimestamp || 0;
            // Fetch all updated content since last sync
            const response = await axios_1.default.post(`${_env_1.API_URL}/api/sync`, { lastSync }, { headers });
            const newContent = response.data;
            // Merge local and remote content
            const mergedContent = this.mergeContent(localContent, newContent);
            // Save merged content locally
            await this.saveContentLocally(mergedContent);
            return { success: true, syncedData: mergedContent };
        }
        catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: 'Sync failed' };
        }
        finally {
            this.syncInProgress = false;
        }
    }
    mergeContent(local, remote) {
        if (!local)
            return remote;
        return {
            topics: this.mergeArrays(local.topics, remote.topics, 'id'),
            explanations: this.mergeArrays(local.explanations, remote.explanations, 'id'),
            progress: this.mergeArrays(local.progress, remote.progress, 'id'),
            quizzes: this.mergeArrays(local.quizzes, remote.quizzes, 'id'),
            lastSyncTimestamp: Date.now(),
        };
    }
    mergeArrays(local, remote, key) {
        const merged = new Map();
        // Add all local items
        local.forEach(item => merged.set(item[key], item));
        // Add or update with remote items
        remote.forEach(item => merged.set(item[key], item));
        return Array.from(merged.values());
    }
    async forceSyncContent() {
        return this.performSync();
    }
    async clearLocalContent() {
        try {
            await async_storage_1.default.removeItem('offline_content');
        }
        catch (error) {
            console.error('Error clearing local content:', error);
            throw error;
        }
    }
    async isContentAvailableOffline() {
        const content = await this.getLocalContent();
        return content !== null;
    }
    async getOfflineContent(key) {
        const content = await this.getLocalContent();
        if (!content) {
            throw new Error('No offline content available');
        }
        return content[key];
    }
}
exports.default = SyncService;
