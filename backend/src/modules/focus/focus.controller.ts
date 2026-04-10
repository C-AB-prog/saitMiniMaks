import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createFocus, deleteFocus, getFocusOrThrow, listUserFocuses, updateFocus } from './focus.service.js';

const uploadedPath = (file?: Express.Multer.File) => (file ? `/uploads/${file.filename}` : undefined);
const getAuthUserId = (req: Request) => (req as AuthenticatedRequest).user.id;
const getParam = (req: Request, key: string) => String(req.params[key] ?? '');

export const listFocuses = async (req: Request, res: Response) => {
  const focuses = await listUserFocuses(getAuthUserId(req));
  res.status(200).json(focuses);
};

export const getFocus = async (req: Request, res: Response) => {
  const focus = await getFocusOrThrow(getAuthUserId(req), getParam(req, 'focusId'));
  res.status(200).json(focus);
};

export const createFocusController = async (req: Request, res: Response) => {
  const focus = await createFocus(getAuthUserId(req), {
    title: req.body.title,
    description: req.body.description,
    coverImage: uploadedPath((req as Request & { file?: Express.Multer.File }).file),
    collaboratorPhones: req.body.collaboratorPhones,
  });

  res.status(201).json(focus);
};

export const updateFocusController = async (req: Request, res: Response) => {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  const focus = await updateFocus(getAuthUserId(req), getParam(req, 'focusId'), {
    title: req.body.title,
    description: req.body.description,
    coverImage: file ? uploadedPath(file) : undefined,
    collaboratorPhones: req.body.collaboratorPhones,
  });

  res.status(200).json(focus);
};

export const deleteFocusController = async (req: Request, res: Response) => {
  await deleteFocus(getAuthUserId(req), getParam(req, 'focusId'));
  res.status(204).send();
};
