import { z } from 'zod';

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .nullable()
  .transform((value) => value ?? undefined);

export const focusTaskParamsSchema = {
  params: z.object({
    focusId: z.string().cuid()
  })
};

export const taskIdParamsSchema = {
  params: z.object({
    taskId: z.string().cuid()
  })
};

export const listTasksQuerySchema = {
  params: z.object({
    focusId: z.string().cuid()
  }),
  query: z.object({
    status: z.enum(['all', 'completed', 'incomplete']).default('all'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
};

export const createTaskSchema = {
  params: z.object({
    focusId: z.string().cuid()
  }),
  body: z.object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(1500).optional().or(z.literal('')),
    dueDate: dateOnlySchema
  })
};

export const updateTaskSchema = {
  params: z.object({
    taskId: z.string().cuid()
  }),
  body: z.object({
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(1500).optional(),
    dueDate: dateOnlySchema,
    completed: z.boolean().optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.')
};
