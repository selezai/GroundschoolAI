export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'document' | 'diagram' | 'video' | 'interactive';
  content: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  lastUpdated: string;
  relatedQuestionSets: string[];
}

export interface StudySection {
  id: string;
  title: string;
  materials: StudyMaterial[];
  progress: number;
  isDownloaded: boolean;
}

export interface StudyProgress {
  materialId: string;
  lastPosition: number; // Page number or video timestamp
  completedSections: string[];
  notes: {
    id: string;
    content: string;
    timestamp: number;
    pageNumber?: number;
  }[];
  bookmarks: {
    id: string;
    title: string;
    description?: string;
    position: number;
    timestamp: number;
  }[];
  lastAccessed: number;
}

export interface DiagramAnnotation {
  id: string;
  materialId: string;
  type: 'text' | 'arrow' | 'highlight';
  position: { x: number; y: number };
  content?: string;
  color: string;
  timestamp: number;
}

export interface StudyNote {
  id: string;
  materialId: string;
  content: string;
  timestamp: number;
  tags: string[];
  position?: {
    page?: number;
    timestamp?: number; // for videos
  };
}
