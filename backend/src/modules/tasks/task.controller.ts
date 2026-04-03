import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createTask, listTasks, removeTask, toggleTaskCompletion, updateTask } from './task.service.js';

export const listTasksController = async (req: AuthenticatedRequest, res: Response) => {
  const tasks = await listTasks(req.user.id, req.params.focusId, {
    status: (req.query.status as 'all' | 'completed' | 'incomplete') ?? 'all',
    date: req.query.date as string | undefined
  });

  res.status(200).json(tasks);
};

export const createTaskController = async (req: AuthenticatedRequest, res: Response) => {
  const task = await createTask(req.user.id, req.params.focusId, req.body);
  res.status(201).json(task);
};

export const updateTaskController = async (req: AuthenticatedRequest, res: Response) => {
  const task = await updateTask(req.user.id, req.params.taskId, req.body);
  res.status(200).json(task);
};

export const toggleTaskController = async (req: AuthenticatedRequest, res: Response) => {
  const task = await toggleTaskCompletion(req.user.id, req.params.taskId);
  res.status(200).json(task);
};

export const deleteTaskController = async (req: AuthenticatedRequest, res: Response) => {
  await removeTask(req.user.id, req.params.taskId);
  res.status(204).send();
};
