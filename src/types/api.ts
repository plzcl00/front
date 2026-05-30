export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
}

export interface ApiErrorBody {
  error: string;
}

export interface MoodboardCanvasMeta {
  width: number;
  height: number;
  background?: string;
}

export interface MoodboardElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'fabric';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  rotation?: number;
  text?: string;
  fontSize?: number;
  color?: string;
  assetId?: number;
  fabricJson?: Record<string, unknown>;
}

export interface MoodboardContent {
  version: number;
  canvas?: MoodboardCanvasMeta;
  elements: MoodboardElement[];
}

export interface Moodboard {
  id: number;
  ownerUsername: string;
  isPublic: boolean;
  content: MoodboardContent;
}

export interface MediaUploadResponse {
  assetId: number;
  contentType: string;
  sizeBytes: number;
}
