import type { LoginRequest, LoginResponse } from '../types/api';
import { apiRequest } from './client';

export function register(body: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body,
    auth: false,
  });
}

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body,
    auth: false,
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
