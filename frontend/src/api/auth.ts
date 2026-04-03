import { apiClient } from './client';
import type { AuthResponse, User } from '../types/api';

export const authApi = {
  register: (payload: { name: string; phone: string; password: string }) =>
    apiClient<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { phone: string; password: string }) =>
    apiClient<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: (token: string) => apiClient<User>('/users/me', { method: 'GET' }, token)
};
