import type { QuizResponseRequest, QuizTodayResponse } from '../types/api';
import { apiRequest } from './client';

function userPath(username: string): string {
  return `/${encodeURIComponent(username)}`;
}

export async function getTodayQuiz(): Promise<QuizTodayResponse> {
  return apiRequest<QuizTodayResponse>('/quiz/today');
}

export async function submitQuizResponse(
  username: string,
  request: QuizResponseRequest,
): Promise<void> {
  await apiRequest<void>(`${userPath(username)}/quiz/responses`, {
    method: 'POST',
    body: request,
  });
}
