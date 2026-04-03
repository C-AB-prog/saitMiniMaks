import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createTaskController,
  deleteTaskController,
  listTasksController,
  toggleTaskController,
  updateTaskController
} from './task.controller.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema
} from './task.schemas.js';

export const taskRouter = Router();

// nested under /focuses/:focusId/tasks
export const nestedTaskRouter = Router({ mergeParams: true });

nestedTaskRouter.use(requireAuth);
nestedTaskRouter.get('/', validate(listTasksQuerySchema), asyncHandler(listTasksController));
nestedTaskRouter.post('/', validate(createTaskSchema), asyncHandler(createTaskController));

taskRouter.use(requireAuth);
taskRouter.patch('/:taskId', validate(updateTaskSchema), asyncHandler(updateTaskController));
taskRouter.patch('/:taskId/toggle', validate(taskIdParamsSchema), asyncHandler(toggleTaskController));
taskRouter.delete('/:taskId', validate(taskIdParamsSchema), asyncHandler(deleteTaskController));
