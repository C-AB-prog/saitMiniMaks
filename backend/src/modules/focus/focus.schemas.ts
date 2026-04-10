import { z } from 'zod';

const phoneItemSchema = z
  .string()
  .trim()
  .min(5)
  .max(32)
  .transform((value) => value.replace(/\s+/g, ''))
  .refine((value) => /^\+?[1-9]\d{7,14}$/.test(value), 'Each collaborator phone must be a valid phone number.');

const collaboratorPhonesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      return JSON.parse(value);
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}, z.array(phoneItemSchema).max(20).default([]));

export const focusParamsSchema = {
  params: z.object({
    focusId: z.string().cuid()
  })
};

export const createFocusSchema = {
  body: z.object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(2).max(1000),
    collaboratorPhones: collaboratorPhonesSchema.optional().default([])
  })
};

export const updateFocusSchema = {
  params: z.object({
    focusId: z.string().cuid()
  }),
  body: z.object({
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(2).max(1000).optional(),
    collaboratorPhones: collaboratorPhonesSchema.optional()
  })
};
