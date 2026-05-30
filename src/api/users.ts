import { apiRequest } from './client';

export function searchUsers(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) {
    return Promise.resolve([]);
  }
  return apiRequest<string[]>(`/users/search?q=${encodeURIComponent(q)}`);
}
