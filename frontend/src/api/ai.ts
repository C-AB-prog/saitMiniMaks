import { apiClient } from './client';

export type AiMessage = {
  id: string;
  focusId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export const aiApi = {
  getHistory: (focusId: string, token: string): Promise<AiMessage[]> =>
    apiClient<{ messages: AiMessage[] }>(
      `/focuses/${focusId}/ai`,
      {},
      token
    ).then(r => r.messages),

  sendMessage: (focusId: string, content: string, token: string): Promise<string> =>
    apiClient<{ reply: string }>(
      `/focuses/${focusId}/ai`,
      { method: 'POST', body: JSON.stringify({ content }) },
      token
    ).then(r => r.reply),

  clearHistory: (focusId: string, token: string): Promise<{ ok: boolean }> =>
    apiClient<{ ok: boolean }>(
      `/focuses/${focusId}/ai`,
      { method: 'DELETE' },
      token
    ),
};
