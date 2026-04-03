import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createFocusChatReply, getFocusChatMessages } from './ai.controller.js';
import { sendFocusChatMessageSchema } from './ai.schemas.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.get('/focuses/:focusId/messages', asyncHandler(getFocusChatMessages));
aiRouter.post('/focuses/:focusId/reply', validate(sendFocusChatMessageSchema), asyncHandler(createFocusChatReply));
