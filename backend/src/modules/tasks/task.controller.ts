import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createTask, listTasks, removeTask, toggleTaskCompletion, updateTask } from './task.service.js';

const getAuthUserId = (req: Request) => (req as AuthenticatedRequest).user.id;
const getParam = (req: Request, key: string) => String(req.params[key] ?? '');

export const listTasksController = async (req: Request, res: Response) => {
  const tasks = await listTasks(getAuthUserId(req), getParam(req, 'focusId'), {
    status: (req.query.status as 'all' | 'completed' | 'incomplete') ?? 'all',
    date: req.query.date as string | undefined,
  });

  res.status(200).json(tasks);
};

export const createTaskController = async (req: Request, res: Response) => {
  const task = await createTask(getAuthUserId(req), getParam(req, 'focusId'), req.body);
  res.status(201).json(task);
};

export const updateTaskController = async (req: Request, res: Response) => {
  const task = await updateTask(getAuthUserId(req), getParam(req, 'taskId'), req.body);
  res.status(200).json(task);
};

export const toggleTaskController = async (req: Request, res: Response) => {
  const task = await toggleTaskCompletion(getAuthUserId(req), getParam(req, 'taskId'));
  res.status(200).json(task);
};

export const deleteTaskController = async (req: Request, res: Response) => {
  await removeTask(getAuthUserId(req), getParam(req, 'taskId'));
  res.status(204).send();
};
