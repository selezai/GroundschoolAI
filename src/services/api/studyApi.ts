import axios from 'axios';
import { ProcessingStatus, StudyMaterial, StudyMaterialMetadata, UploadResponse } from '../../types/study';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../auth';
import { QuestionSet, SubjectCategory } from '../../types/question';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Longer timeout for file uploads
});

export const studyApi = {
  // Get upload URL and create study material record
  initiateUpload: async (metadata: StudyMaterialMetadata): Promise<UploadResponse> => {
    const response = await api.post('/study/initiate-upload', metadata);
    return response.data;
  },

  // Upload file to storage
  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  // Get processing status of uploaded material
  getProcessingStatus: async (materialId: string): Promise<ProcessingStatus> => {
    const response = await api.get(`/study/status/${materialId}`);
    return response.data;
  },

  // List all study materials for user
  listMaterials: async (): Promise<StudyMaterial[]> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/study/materials`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Get single study material
  getMaterial: async (materialId: string): Promise<StudyMaterial & {
    processedContent: string;
    category: SubjectCategory;
    topics: string[];
    hasVisuals: boolean;
  }> => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/study/materials/${materialId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Delete study material
  deleteMaterial: async (materialId: string): Promise<void> => {
    const token = await getAuthToken();
    await axios.delete(`${API_BASE_URL}/study/materials/${materialId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Update study material metadata
  updateMaterial: async (
    materialId: string,
    updates: Partial<StudyMaterialMetadata>
  ): Promise<StudyMaterial> => {
    const response = await api.patch(`/study/materials/${materialId}`, updates);
    return response.data;
  },

  async getUploadUrl(metadata: {
    title: string;
    type: string;
    size: number;
  }): Promise<{ uploadUrl: string; token: string }> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/study/upload-url`,
      metadata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async completeUpload(uploadToken: string): Promise<StudyMaterial> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/study/complete-upload`,
      { uploadToken },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async createQuestionSet(questionSet: {
    title: string;
    description: string;
    category: SubjectCategory;
    questions: any[];
    totalQuestions: number;
    timeLimit: number;
    passingScore: number;
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  }): Promise<QuestionSet> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/study/question-sets`,
      questionSet,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getProcessingStatus(
    materialId: string
  ): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
  }> {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/study/materials/${materialId}/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async generateQuestionsFromMaterial(
    materialId: string,
    config: {
      category: SubjectCategory;
      count: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      includeDiagrams?: boolean;
      tags?: string[];
    }
  ): Promise<{
    status: string;
    taskId: string;
  }> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/study/materials/${materialId}/generate-questions`,
      config,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  async getGenerationStatus(
    taskId: string
  ): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    questions?: any[];
    error?: string;
  }> {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/study/generation-tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
