import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createFocus, deleteFocus, getFocusOrThrow, listUserFocuses, updateFocus } from './focus.service.js';

const uploadedPath = (file?: Express.Multer.File) => (file ? `/uploads/${file.filename}` : undefined);

export const listFocuses = async (req: AuthenticatedRequest, res: Response) => {
  const focuses = await listUserFocuses(req.user.id);
  res.status(200).json(focuses);
};

export const getFocus = async (req: AuthenticatedRequest, res: Response) => {
  const focus = await getFocusOrThrow(req.user.id, req.params.focusId);
  res.status(200).json(focus);
};

export const createFocusController = async (req: AuthenticatedRequest, res: Response) => {
  const focus = await createFocus(req.user.id, {
    title: req.body.title,
    description: req.body.description,
    coverImage: uploadedPath(req.file),
    collaboratorPhones: req.body.collaboratorPhones
  });

  res.status(201).json(focus);
};

export const updateFocusController = async (req: AuthenticatedRequest, res: Response) => {
  const focus = await updateFocus(req.user.id, req.params.focusId, {
    title: req.body.title,
    description: req.body.description,
    coverImage: req.file ? uploadedPath(req.file) : undefined,
    collaboratorPhones: req.body.collaboratorPhones
  });

  res.status(200).json(focus);
};

export const deleteFocusController = async (req: AuthenticatedRequest, res: Response) => {
  await deleteFocus(req.user.id, req.params.focusId);
  res.status(204).send();
};
