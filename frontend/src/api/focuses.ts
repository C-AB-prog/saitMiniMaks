import { apiClient } from './client';
import type { Focus, FocusSummary, Task } from '../types/api';

export const focusApi = {
  list: (token: string) => apiClient<FocusSummary[]>('/focuses', { method: 'GET' }, token),
  get: (focusId: string, token: string) => apiClient<Focus>(`/focuses/${focusId}`, { method: 'GET' }, token),
  create: (payload: FormData, token: string) => apiClient<Focus>('/focuses', { method: 'POST', body: payload }, token),
  update: (focusId: string, payload: FormData, token: string) =>
    apiClient<Focus>(`/focuses/${focusId}`, { method: 'PATCH', body: payload }, token),
  remove: (focusId: string, token: string) => apiClient<void>(`/focuses/${focusId}`, { method: 'DELETE' }, token),
  listTasks: (focusId: string, token: string, search = '') =>
    apiClient<Task[]>(`/focuses/${focusId}/tasks${search}`, { method: 'GET' }, token),
  createTask: (focusId: string, payload: { title: string; description?: string; dueDate?: string }, token: string) =>
    apiClient<Task>(`/focuses/${focusId}/tasks`, { method: 'POST', body: JSON.stringify(payload) }, token),
  updateTask: (taskId: string, payload: Partial<Pick<Task, 'title' | 'description' | 'dueDate' | 'completed'>>, token: string) =>
    apiClient<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),
  toggleTask: (taskId: string, token: string) =>
    apiClient<Task>(`/tasks/${taskId}/toggle`, { method: 'PATCH' }, token),
  removeTask: (taskId: string, token: string) => apiClient<void>(`/tasks/${taskId}`, { method: 'DELETE' }, token)
};
