import type { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service.js';

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.status(200).json(result);
};
