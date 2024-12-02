import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyMaterial, StudyProgress, StudyNote, DiagramAnnotation } from '../../types/studyMaterial';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

class StudyMaterialService {
  private static instance: StudyMaterialService;
  private readonly STORAGE_KEYS = {
    PROGRESS: '@study_progress',
    NOTES: '@study_notes',
    ANNOTATIONS: '@annotations',
    DOWNLOADED_MATERIALS: '@downloaded_materials',
  };

  private constructor() {}

  public static getInstance(): StudyMaterialService {
    if (!StudyMaterialService.instance) {
      StudyMaterialService.instance = new StudyMaterialService();
    }
    return StudyMaterialService.instance;
  }

  // Fetch study materials based on learning path and user progress
  async getRecommendedMaterials(category: string, difficulty: string): Promise<StudyMaterial[]> {
    try {
      // TODO: Implement API call to fetch materials
      return [];
    } catch (error) {
      console.error('Error fetching recommended materials:', error);
      throw error;
    }
  }

  // Download study material for offline access
  async downloadMaterial(material: StudyMaterial): Promise<boolean> {
    try {
      if (!material.fileUrl) return false;

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
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.DOWNLOADED_MATERIALS,
          JSON.stringify(downloadedMaterials)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error downloading material:', error);
      return false;
    }
  }

  // Get list of downloaded materials
  async getDownloadedMaterials(): Promise<string[]> {
    try {
      const downloaded = await AsyncStorage.getItem(this.STORAGE_KEYS.DOWNLOADED_MATERIALS);
      return downloaded ? JSON.parse(downloaded) : [];
    } catch (error) {
      console.error('Error getting downloaded materials:', error);
      return [];
    }
  }

  // Save study progress
  async saveProgress(progress: StudyProgress): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.PROGRESS}_${progress.materialId}`;
      await AsyncStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  // Get study progress
  async getProgress(materialId: string): Promise<StudyProgress | null> {
    try {
      const key = `${this.STORAGE_KEYS.PROGRESS}_${materialId}`;
      const progress = await AsyncStorage.getItem(key);
      return progress ? JSON.parse(progress) : null;
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }

  // Save study note
  async saveNote(note: StudyNote): Promise<void> {
    try {
      const notes = await this.getNotes(note.materialId);
      const updatedNotes = [...notes, note];
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.NOTES}_${note.materialId}`,
        JSON.stringify(updatedNotes)
      );
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  // Get study notes
  async getNotes(materialId: string): Promise<StudyNote[]> {
    try {
      const notes = await AsyncStorage.getItem(`${this.STORAGE_KEYS.NOTES}_${materialId}`);
      return notes ? JSON.parse(notes) : [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  // Save diagram annotation
  async saveAnnotation(annotation: DiagramAnnotation): Promise<void> {
    try {
      const annotations = await this.getAnnotations(annotation.materialId);
      const updatedAnnotations = [...annotations, annotation];
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.ANNOTATIONS}_${annotation.materialId}`,
        JSON.stringify(updatedAnnotations)
      );
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
  }

  // Get diagram annotations
  async getAnnotations(materialId: string): Promise<DiagramAnnotation[]> {
    try {
      const annotations = await AsyncStorage.getItem(
        `${this.STORAGE_KEYS.ANNOTATIONS}_${materialId}`
      );
      return annotations ? JSON.parse(annotations) : [];
    } catch (error) {
      console.error('Error getting annotations:', error);
      return [];
    }
  }

  // Delete study material and related data
  async deleteMaterial(materialId: string): Promise<void> {
    try {
      const downloadedMaterials = await this.getDownloadedMaterials();
      const updatedMaterials = downloadedMaterials.filter(id => id !== materialId);
      
      // Remove from downloaded list
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.DOWNLOADED_MATERIALS,
        JSON.stringify(updatedMaterials)
      );

      // Remove progress, notes, and annotations
      await AsyncStorage.removeItem(`${this.STORAGE_KEYS.PROGRESS}_${materialId}`);
      await AsyncStorage.removeItem(`${this.STORAGE_KEYS.NOTES}_${materialId}`);
      await AsyncStorage.removeItem(`${this.STORAGE_KEYS.ANNOTATIONS}_${materialId}`);

      // Remove downloaded file
      const downloadDir = `${FileSystem.documentDirectory}study_materials/`;
      const files = await FileSystem.readDirectoryAsync(downloadDir);
      const materialFile = files.find(file => file.startsWith(materialId));
      
      if (materialFile) {
        await FileSystem.deleteAsync(`${downloadDir}${materialFile}`);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }
}
