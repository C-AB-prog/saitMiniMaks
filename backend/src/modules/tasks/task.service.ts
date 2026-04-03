import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { getFocusOrThrow, getTaskAccessWhere } from '../focus/focus.service.js';

export const listTasks = async (
  userId: string,
  focusId: string,
  filters: { status: 'all' | 'completed' | 'incomplete'; date?: string }
) => {
  await getFocusOrThrow(userId, focusId);

  return prisma.task.findMany({
    where: {
      focusId,
      ...(filters.status === 'completed' ? { completed: true } : {}),
      ...(filters.status === 'incomplete' ? { completed: false } : {}),
      ...(filters.date ? { dueDate: filters.date } : {})
    },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
  });
};

export const createTask = async (
  userId: string,
  focusId: string,
  input: { title: string; description?: string; dueDate?: string }
) => {
  await getFocusOrThrow(userId, focusId);

  return prisma.task.create({
    data: {
      focusId,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate || null
    }
  });
};

export const getTaskForUser = async (userId: string, taskId: string) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhere(userId)
    }
  });

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  return task;
};

export const updateTask = async (
  userId: string,
  taskId: string,
  input: { title?: string; description?: string; dueDate?: string; completed?: boolean }
) => {
  await getTaskForUser(userId, taskId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate || null } : {}),
      ...(input.completed !== undefined ? { completed: input.completed } : {})
    }
  });
};

export const toggleTaskCompletion = async (userId: string, taskId: string) => {
  const task = await getTaskForUser(userId, taskId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      completed: !task.completed
    }
  });
};

export const removeTask = async (userId: string, taskId: string) => {
  await getTaskForUser(userId, taskId);
  await prisma.task.delete({ where: { id: taskId } });
};
