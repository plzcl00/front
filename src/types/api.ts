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
  type: 'text' | 'image' | 'fabric';
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
  name: string;
  isPublic: boolean;
  hasThumbnail: boolean;
  likeCount?: number;
  content: MoodboardContent;
}

export interface LikedMoodboardSummary {
  id: number;
  ownerUsername: string;
  name: string;
  hasThumbnail: boolean;
  likeCount?: number;
}

export interface MoodboardCreateRequest {
  content: MoodboardContent;
  name?: string;
}

export interface MediaUploadResponse {
  assetId: number;
  contentType: string;
  sizeBytes: number;
}

export interface PublicMoodboardFeedItem {
  id: number;
  ownerUsername: string;
  name: string;
  hasThumbnail: boolean;
  likeCount?: number;
}

export interface PublicMoodboardsPage {
  items: PublicMoodboardFeedItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface DiaryEntry {
  id: number;
  ownerUsername: string;
  entryDate: string;
  moodScore: number;
  textNote?: string | null;
  linkedMoodboardId?: number | null;
  reminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntryRequest {
  entryDate: string;
  moodScore: number;
  textNote?: string | null;
  linkedMoodboardId?: number | null;
  reminderAt?: string | null;
}

export interface MetricsResponse {
  period: string;
  averageMood: number;
  entryStreak: number;
  totalEntries: number;
  trend: { date: string; moodScore: number }[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
