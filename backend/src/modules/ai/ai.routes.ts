import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getHistoryController,
  postMessageController,
  clearHistoryController,
} from './ai.controller.js';

export const aiRouter = Router({ mergeParams: true });

aiRouter.use(requireAuth);

aiRouter.get('/', getHistoryController);
aiRouter.post('/', postMessageController);
aiRouter.delete('/', clearHistoryController);
