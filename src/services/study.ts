import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { StudyMaterial } from '../types/study';
import studyApi from './api/studyApi';

class StudyService {
  private static instance: StudyService;

  private constructor() {}

  static getInstance(): StudyService {
    if (!StudyService.instance) {
      StudyService.instance = new StudyService();
    }
    return StudyService.instance;
  }

  async pickDocument(): Promise<DocumentPickerResponse | null> {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      return result[0];
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Error picking document:', err);
      }
      return null;
    }
  }

  async pickImage() {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (err) {
      console.error('Error picking image:', err);
      return null;
    }
  }

  async uploadStudyMaterial(
    file: DocumentPickerResponse | any,
    onProgress?: (progress: number) => void
  ): Promise<StudyMaterial> {
    try {
      // Get file info
      const fileStats = await RNFS.stat(file.uri);
      
      // Create upload metadata
      const metadata = {
        title: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        size: parseInt(fileStats.size),
      };

      // Get upload URL and token
      const { uploadUrl, token } = await studyApi.getUploadUrl(metadata);

      // Upload file
      const response = await RNFS.uploadFiles({
        toUrl: uploadUrl,
        files: [{
          name: file.name,
          filename: file.name,
          filepath: file.uri,
          type: file.type,
        }],
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Authorization': `Bearer ${token}`,
        },
        progress: (response) => {
          const progress = response.totalBytesSent / response.totalBytesExpectedToSend;
          onProgress?.(progress);
        },
      }).promise;

      if (response.statusCode !== 200) {
        throw new Error('Upload failed');
      }

      // Complete upload and get material
      return await studyApi.completeUpload(token);
    } catch (error) {
      console.error('Error uploading study material:', error);
      throw error;
    }
  }

  async listMaterials(): Promise<StudyMaterial[]> {
    return await studyApi.listMaterials();
  }

  async deleteMaterial(materialId: string): Promise<void> {
    await studyApi.deleteMaterial(materialId);
  }

  async getMaterial(materialId: string): Promise<StudyMaterial> {
    return await studyApi.getMaterial(materialId);
  }
}

export default StudyService.getInstance();
