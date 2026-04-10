import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { getChatHistory, sendMessage, deleteChatHistory } from './ai.service.js';

const getAuthUserId = (req: Request) => (req as AuthenticatedRequest).user.id;
const getParam = (req: Request, key: string) => String(req.params[key] ?? '');

const checkFocusAccess = async (focusId: string, userId: string) => {
  const focus = await prisma.focus.findUnique({
    where: { id: focusId },
    include: { members: { select: { userId: true } } },
  });

  if (!focus) throw new AppError('Focus not found.', 404);

  const isOwner = focus.userId === userId;
  const isMember = focus.members.some((member) => member.userId === userId);

  if (!isOwner && !isMember) {
    throw new AppError('You do not have access to this Focus.', 403);
  }

  return { focus, isOwner };
};

export const getHistoryController = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const focusId = getParam(req, 'focusId');
    const userId = getAuthUserId(req);

    await checkFocusAccess(focusId, userId);
    const messages = await getChatHistory(focusId);

    res.json({ messages });
  }
);

export const postMessageController = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const focusId = getParam(req, 'focusId');
    const userId = getAuthUserId(req);
    const { content } = req.body as { content?: string };

    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new AppError('Message content is required.', 400);
    }

    if (content.trim().length > 4000) {
      throw new AppError('Message is too long. Maximum 4000 characters.', 400);
    }

    await checkFocusAccess(focusId, userId);
    const reply = await sendMessage(focusId, content.trim());

    res.json({ reply });
  }
);

export const clearHistoryController = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const focusId = getParam(req, 'focusId');
    const userId = getAuthUserId(req);
    const { isOwner } = await checkFocusAccess(focusId, userId);

    if (!isOwner) {
      throw new AppError('Only the Focus owner can clear chat history.', 403);
    }

    await deleteChatHistory(focusId);
    res.json({ ok: true });
  }
);
