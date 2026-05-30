import type { MetricsResponse } from '../types/api';
import { apiRequest } from './client';

function userPath(username: string): string {
  return `/${encodeURIComponent(username)}`;
}

export type MetricsPeriod = '7d' | '30d' | '90d';

export async function getMetrics(
  username: string,
  period: MetricsPeriod = '30d',
): Promise<MetricsResponse> {
  return apiRequest<MetricsResponse>(`${userPath(username)}/metrics?period=${period}`);
}
