import type { DiaryEntry, DiaryEntryRequest } from '../types/api';
import { ApiError } from './client';
import { apiRequest } from './client';

function userPath(username: string): string {
  return `/${encodeURIComponent(username)}`;
}

export async function listDiaryEntries(
  username: string,
  from: string,
  to: string,
): Promise<DiaryEntry[]> {
  const params = new URLSearchParams({ from, to });
  return apiRequest<DiaryEntry[]>(`${userPath(username)}/diary/entries?${params}`);
}

export async function getDiaryEntry(
  username: string,
  date: string,
): Promise<DiaryEntry | null> {
  try {
    return await apiRequest<DiaryEntry>(`${userPath(username)}/diary/entries/${date}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function upsertDiaryEntry(
  username: string,
  request: DiaryEntryRequest,
): Promise<DiaryEntry> {
  return apiRequest<DiaryEntry>(`${userPath(username)}/diary/entries`, {
    method: 'POST',
    body: request,
  });
}

export async function deleteDiaryEntry(username: string, date: string): Promise<void> {
  await apiRequest<void>(`${userPath(username)}/diary/entries/${date}`, {
    method: 'DELETE',
  });
}
