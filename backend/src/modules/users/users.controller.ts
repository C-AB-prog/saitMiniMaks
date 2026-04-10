import type { Request, Response } from 'express';
import { getCurrentUser } from '../auth/auth.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export const me = async (req: Request, res: Response) => {
  const user = await getCurrentUser((req as AuthenticatedRequest).user.id);
  res.status(200).json(user);
};
