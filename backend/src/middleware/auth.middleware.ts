import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/app-error.js';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: string;
  };
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401));
  }

  try {
    const token = authorization.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    (req as AuthenticatedRequest).user = user;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }
};
