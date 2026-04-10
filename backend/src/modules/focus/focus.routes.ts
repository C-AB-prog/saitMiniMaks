import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createFocusController,
  deleteFocusController,
  getFocus,
  listFocuses,
  updateFocusController
} from './focus.controller.js';
import { createFocusSchema, focusParamsSchema, updateFocusSchema } from './focus.schemas.js';

export const focusRouter = Router();

focusRouter.use(requireAuth);

focusRouter.get('/', asyncHandler(listFocuses));
focusRouter.get('/:focusId', validate(focusParamsSchema), asyncHandler(getFocus));
focusRouter.post('/', upload.single('coverImage'), validate(createFocusSchema), asyncHandler(createFocusController));
focusRouter.patch(
  '/:focusId',
  upload.single('coverImage'),
  validate(updateFocusSchema),
  asyncHandler(updateFocusController)
);
focusRouter.delete('/:focusId', validate(focusParamsSchema), asyncHandler(deleteFocusController));
