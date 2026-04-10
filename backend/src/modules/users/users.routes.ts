import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { me } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, asyncHandler(me));
