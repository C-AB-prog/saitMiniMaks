import type { Response } from 'express';
import { getCurrentUser } from '../auth/auth.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export const me = async (req: AuthenticatedRequest, res: Response) => {
  const user = await getCurrentUser(req.user.id);
  res.status(200).json(user);
};
