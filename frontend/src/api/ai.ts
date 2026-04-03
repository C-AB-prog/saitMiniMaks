import { apiClient } from './client';
import type { FocusChatMessage, FocusChatReply } from '../types/api';

export const aiApi = {
  listMessages: (focusId: string, token: string) => apiClient<FocusChatMessage[]>(`/ai/focuses/${focusId}/messages`, { method: 'GET' }, token),
  sendMessage: (focusId: string, payload: { content: string }, token: string) =>
    apiClient<FocusChatReply>(`/ai/focuses/${focusId}/reply`, { method: 'POST', body: JSON.stringify(payload) }, token)
};
