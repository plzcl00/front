import type {
  LikedMoodboardSummary,
  MediaUploadResponse,
  Moodboard,
  MoodboardContent,
  MoodboardCreateRequest,
  PublicMoodboardsPage,
} from '../types/api';
import { apiRequest, apiRequestBytes } from './client';

function userPath(username: string): string {
  return `/${encodeURIComponent(username)}`;
}

/** Jackson may serialize the boolean as `public` instead of `isPublic`. */
function normalizeMoodboard(raw: Moodboard & { public?: boolean }): Moodboard {
  return {
    ...raw,
    name: raw.name?.trim() || 'Sin título',
    isPublic: raw.isPublic ?? raw.public ?? false,
    hasThumbnail: raw.hasThumbnail ?? false,
  };
}

function normalizeList(raw: (Moodboard & { public?: boolean })[]): Moodboard[] {
  return raw.map(normalizeMoodboard);
}

export async function listMoodboards(username: string): Promise<Moodboard[]> {
  const raw = await apiRequest<(Moodboard & { public?: boolean })[]>(
    `${userPath(username)}/moodboards`,
  );
  return normalizeList(raw);
}

export async function getMoodboard(
  username: string,
  moodboardId: number,
): Promise<Moodboard> {
  const raw = await apiRequest<Moodboard & { public?: boolean }>(
    `${userPath(username)}/moodboards/${moodboardId}`,
  );
  return normalizeMoodboard(raw);
}

export async function createMoodboard(
  username: string,
  request: MoodboardContent | MoodboardCreateRequest,
): Promise<Moodboard> {
  const body: MoodboardCreateRequest =
    'version' in request
      ? { content: request, name: 'Sin título' }
      : { ...request, name: request.name ?? 'Sin título' };
  const raw = await apiRequest<Moodboard & { public?: boolean }>(
    `${userPath(username)}/moodboards`,
    { method: 'POST', body },
  );
  return normalizeMoodboard(raw);
}

export async function renameMoodboard(
  username: string,
  moodboardId: number,
  name: string,
): Promise<Moodboard> {
  const raw = await apiRequest<Moodboard & { public?: boolean }>(
    `${userPath(username)}/moodboards/${moodboardId}`,
    { method: 'PATCH', body: { name } },
  );
  return normalizeMoodboard(raw);
}

export async function updateMoodboard(
  username: string,
  moodboardId: number,
  content: MoodboardContent,
): Promise<Moodboard> {
  const raw = await apiRequest<Moodboard & { public?: boolean }>(
    `${userPath(username)}/moodboards/${moodboardId}`,
    { method: 'PUT', body: content },
  );
  return normalizeMoodboard(raw);
}

export function deleteMoodboard(
  username: string,
  moodboardId: number,
): Promise<void> {
  return apiRequest<void>(
    `${userPath(username)}/moodboards/${moodboardId}`,
    { method: 'DELETE' },
  );
}

export async function setVisibility(
  username: string,
  moodboardId: number,
  isPublic: boolean,
): Promise<Moodboard> {
  const raw = await apiRequest<Moodboard & { public?: boolean }>(
    `${userPath(username)}/moodboards/${moodboardId}/visibility?isPublic=${isPublic}`,
    { method: 'PUT' },
  );
  return normalizeMoodboard(raw);
}

export function grantPermission(
  username: string,
  moodboardId: number,
  grantTo: string,
): Promise<void> {
  return apiRequest<void>(
    `${userPath(username)}/moodboards/${moodboardId}/permissions?grantTo=${encodeURIComponent(grantTo)}`,
    { method: 'POST' },
  );
}

export function revokePermission(
  username: string,
  moodboardId: number,
  revokeFrom: string,
): Promise<void> {
  return apiRequest<void>(
    `${userPath(username)}/moodboards/${moodboardId}/permissions?revokeFrom=${encodeURIComponent(revokeFrom)}`,
    { method: 'DELETE' },
  );
}

export function likeMoodboard(
  username: string,
  moodboardId: number,
): Promise<void> {
  return apiRequest<void>(
    `${userPath(username)}/moodboards/${moodboardId}/likes`,
    { method: 'POST' },
  );
}

export function unlikeMoodboard(
  username: string,
  moodboardId: number,
): Promise<void> {
  return apiRequest<void>(
    `${userPath(username)}/moodboards/${moodboardId}/likes`,
    { method: 'DELETE' },
  );
}

export function getLikes(
  username: string,
  moodboardId: number,
): Promise<string[]> {
  return apiRequest<string[]>(
    `${userPath(username)}/moodboards/${moodboardId}/likes`,
  );
}

export function getLikeCount(
  username: string,
  moodboardId: number,
): Promise<number> {
  return apiRequest<number>(
    `${userPath(username)}/moodboards/${moodboardId}/likes/count`,
  );
}

export function getLikedMoodboards(
  username: string,
): Promise<LikedMoodboardSummary[]> {
  return apiRequest<LikedMoodboardSummary[]>(
    `${userPath(username)}/liked-moodboards`,
  );
}

export function uploadMedia(
  username: string,
  moodboardId: number,
  file: File,
): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<MediaUploadResponse>(
    `${userPath(username)}/moodboards/${moodboardId}/media`,
    { method: 'POST', formData },
  );
}

export function deleteMedia(
  username: string,
  moodboardId: number,
  assetId: number,
): Promise<void> {
  return apiRequest<void>(
    `${userPath(username)}/moodboards/${moodboardId}/media/${assetId}`,
    { method: 'DELETE' },
  );
}

export function mediaUrl(
  username: string,
  moodboardId: number,
  assetId: number,
): string {
  return `${userPath(username)}/moodboards/${moodboardId}/media/${assetId}`;
}

export function fetchMediaBlob(
  username: string,
  moodboardId: number,
  assetId: number,
): Promise<Blob> {
  return apiRequestBytes(mediaUrl(username, moodboardId, assetId));
}

export function thumbnailPath(username: string, moodboardId: number): string {
  return `${userPath(username)}/moodboards/${moodboardId}/thumbnail`;
}

export function fetchThumbnailBlob(
  username: string,
  moodboardId: number,
): Promise<Blob> {
  return apiRequestBytes(thumbnailPath(username, moodboardId));
}

export function uploadThumbnail(
  username: string,
  moodboardId: number,
  blob: Blob,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', blob, 'thumbnail.jpg');
  return apiRequest<void>(thumbnailPath(username, moodboardId), {
    method: 'PUT',
    formData,
  });
}

export async function listPublicMoodboards(
  page = 0,
  size = 24,
): Promise<PublicMoodboardsPage> {
  return apiRequest<PublicMoodboardsPage>(
    `/public/moodboards?page=${page}&size=${size}`,
  );
}
