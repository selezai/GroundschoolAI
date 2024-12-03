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
const FileSystem = __importStar(require("expo-file-system"));
class StudyMaterialService {
    constructor() {
        this.STORAGE_KEYS = {
            PROGRESS: '@study_progress',
            NOTES: '@study_notes',
            ANNOTATIONS: '@annotations',
            DOWNLOADED_MATERIALS: '@downloaded_materials',
        };
    }
    static getInstance() {
        if (!StudyMaterialService.instance) {
            StudyMaterialService.instance = new StudyMaterialService();
        }
        return StudyMaterialService.instance;
    }
    // Fetch study materials based on learning path and user progress
    async getRecommendedMaterials(category, difficulty) {
        try {
            // TODO: Implement API call to fetch materials
            return [];
        }
        catch (error) {
            console.error('Error fetching recommended materials:', error);
            throw error;
        }
    }
    // Download study material for offline access
    async downloadMaterial(material) {
        try {
            if (!material.fileUrl)
                return false;
            const downloadDir = `${FileSystem.documentDirectory}study_materials/`;
            const fileName = `${material.id}_${material.title.replace(/\s+/g, '_').toLowerCase()}`;
            const fileUri = `${downloadDir}${fileName}`;
            // Create directory if it doesn't exist
            const dirInfo = await FileSystem.getInfoAsync(downloadDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
            }
            // Download file
            const downloadResult = await FileSystem.downloadAsync(material.fileUrl, fileUri);
            if (downloadResult.status === 200) {
                // Save downloaded status
                const downloadedMaterials = await this.getDownloadedMaterials();
                downloadedMaterials.push(material.id);
                await async_storage_1.default.setItem(this.STORAGE_KEYS.DOWNLOADED_MATERIALS, JSON.stringify(downloadedMaterials));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error downloading material:', error);
            return false;
        }
    }
    // Get list of downloaded materials
    async getDownloadedMaterials() {
        try {
            const downloaded = await async_storage_1.default.getItem(this.STORAGE_KEYS.DOWNLOADED_MATERIALS);
            return downloaded ? JSON.parse(downloaded) : [];
        }
        catch (error) {
            console.error('Error getting downloaded materials:', error);
            return [];
        }
    }
    // Save study progress
    async saveProgress(progress) {
        try {
            const key = `${this.STORAGE_KEYS.PROGRESS}_${progress.materialId}`;
            await async_storage_1.default.setItem(key, JSON.stringify(progress));
        }
        catch (error) {
            console.error('Error saving progress:', error);
            throw error;
        }
    }
    // Get study progress
    async getProgress(materialId) {
        try {
            const key = `${this.STORAGE_KEYS.PROGRESS}_${materialId}`;
            const progress = await async_storage_1.default.getItem(key);
            return progress ? JSON.parse(progress) : null;
        }
        catch (error) {
            console.error('Error getting progress:', error);
            return null;
        }
    }
    // Save study note
    async saveNote(note) {
        try {
            const notes = await this.getNotes(note.materialId);
            const updatedNotes = [...notes, note];
            await async_storage_1.default.setItem(`${this.STORAGE_KEYS.NOTES}_${note.materialId}`, JSON.stringify(updatedNotes));
        }
        catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    }
    // Get study notes
    async getNotes(materialId) {
        try {
            const notes = await async_storage_1.default.getItem(`${this.STORAGE_KEYS.NOTES}_${materialId}`);
            return notes ? JSON.parse(notes) : [];
        }
        catch (error) {
            console.error('Error getting notes:', error);
            return [];
        }
    }
    // Save diagram annotation
    async saveAnnotation(annotation) {
        try {
            const annotations = await this.getAnnotations(annotation.materialId);
            const updatedAnnotations = [...annotations, annotation];
            await async_storage_1.default.setItem(`${this.STORAGE_KEYS.ANNOTATIONS}_${annotation.materialId}`, JSON.stringify(updatedAnnotations));
        }
        catch (error) {
            console.error('Error saving annotation:', error);
            throw error;
        }
    }
    // Get diagram annotations
    async getAnnotations(materialId) {
        try {
            const annotations = await async_storage_1.default.getItem(`${this.STORAGE_KEYS.ANNOTATIONS}_${materialId}`);
            return annotations ? JSON.parse(annotations) : [];
        }
        catch (error) {
            console.error('Error getting annotations:', error);
            return [];
        }
    }
    // Delete study material and related data
    async deleteMaterial(materialId) {
        try {
            const downloadedMaterials = await this.getDownloadedMaterials();
            const updatedMaterials = downloadedMaterials.filter(id => id !== materialId);
            // Remove from downloaded list
            await async_storage_1.default.setItem(this.STORAGE_KEYS.DOWNLOADED_MATERIALS, JSON.stringify(updatedMaterials));
            // Remove progress, notes, and annotations
            await async_storage_1.default.removeItem(`${this.STORAGE_KEYS.PROGRESS}_${materialId}`);
            await async_storage_1.default.removeItem(`${this.STORAGE_KEYS.NOTES}_${materialId}`);
            await async_storage_1.default.removeItem(`${this.STORAGE_KEYS.ANNOTATIONS}_${materialId}`);
            // Remove downloaded file
            const downloadDir = `${FileSystem.documentDirectory}study_materials/`;
            const files = await FileSystem.readDirectoryAsync(downloadDir);
            const materialFile = files.find(file => file.startsWith(materialId));
            if (materialFile) {
                await FileSystem.deleteAsync(`${downloadDir}${materialFile}`);
            }
        }
        catch (error) {
            console.error('Error deleting material:', error);
            throw error;
        }
    }
}
