import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { listFocusChatMessages, sendFocusChatMessage } from './ai.service.js';

export const getFocusChatMessages = async (req: AuthenticatedRequest, res: Response) => {
  const messages = await listFocusChatMessages(req.user.id, req.params.focusId);
  res.status(200).json(messages);
};

export const createFocusChatReply = async (req: AuthenticatedRequest, res: Response) => {
  const result = await sendFocusChatMessage(req.user.id, req.params.focusId, req.body.content);
  res.status(201).json(result);
};
