import { z } from 'zod';

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ''))
  .refine((value) => /^\+?[1-9]\d{7,14}$/.test(value), 'Phone must be a valid international phone number.');

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    password: z.string().min(8).max(72)
  })
};

export const loginSchema = {
  body: z.object({
    phone: phoneSchema,
    password: z.string().min(8).max(72)
  })
};
