export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  type: 'pdf' | 'image';
  fileUrl: string;
  uploadDate: string;
  processedStatus: 'pending' | 'processing' | 'completed' | 'failed';
  size: number;
  pageCount?: number;
  thumbnail?: string;
}

export interface UploadResponse {
  material: StudyMaterial;
  uploadUrl: string;
}

export interface ProcessingStatus {
  materialId: string;
  status: StudyMaterial['processedStatus'];
  progress?: number;
  error?: string;
}

export interface StudyMaterialMetadata {
  title: string;
  type: 'pdf' | 'image';
  size: number;
  pageCount?: number;
}
