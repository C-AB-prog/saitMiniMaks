import { z } from 'zod';

export const sendFocusChatMessageSchema = {
  body: z.object({
    content: z.string().trim().min(2, 'Message is too short.').max(4000, 'Message is too long.')
  })
};
