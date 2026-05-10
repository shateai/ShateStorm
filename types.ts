
export interface Slide {
  id: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  imagePrompt: string;
  imageBase64?: string; // Original base64
  imageUrl?: string;    // Cloud Storage URL
  audioBase64?: string; // Original base64
  audioUrl?: string;    // Cloud Storage URL
  animation?: 'pan' | 'pop' | 'zoom' | 'flip'; 
  layout?: 'standard' | 'reversed' | 'vertical' | 'full-image' | 'text-only' | 'big-title' | 'split-3';
  shape?: string; 
  x?: number; 
  y?: number;
  imageValidation?: {
    isOk: boolean;
    reason: string;
    score: number; // 0-10
  };
}

export interface Source {
  title: string;
  uri: string;
}

export interface Presentation {
  id: string;
  topic: string;
  presentationTitle: string;
  slides: Slide[];
  sources: Source[];
  createdAt: any;
  updatedAt: any;
  userId: string;
  status: 'draft' | 'generating' | 'complete';
  isPublic?: boolean;
}

export interface DraftSlide {
  title: string;
  description: string;
  suggestedBullets: string[];
}

export interface UserStats {
  dailyImageCount: number;
  lastImageGenerationDate: string; // YYYY-MM-DD
}

export interface AppState {
  step: 'dashboard' | 'input' | 'outline' | 'generating' | 'preview' | 'gallery' | 'explore' | 'public_view';
  topic: string;
  voice: string; 
  slideCount: number;
  files: File[];
  filePreviews: string[]; 
  presentation: Presentation | null;
  outline: DraftSlide[] | null;
  currentSlideIndex: number;
  loadingStatus: string;
  progress: number;
  presentations: Presentation[];
}

export enum GenerationStage {
  IDLE,
  STRUCTURE,
  IMAGES,
  AUDIO,
  COMPLETE
}
