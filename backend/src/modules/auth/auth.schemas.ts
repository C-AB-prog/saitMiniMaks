import { z } from 'zod';

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ''))
  .refine((value) => /^\+?[1-9]\d{7,14}$/.test(value), 'Phone must be a valid international phone number.');

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine((value) => /[a-z]/.test(value), 'Password must include at least one lowercase letter.')
  .refine((value) => /[A-Z]/.test(value), 'Password must include at least one uppercase letter.')
  .refine((value) => /\d/.test(value), 'Password must include at least one number.')
  .refine((value) => /[^a-zA-Z0-9]/.test(value), 'Password must include at least one special character.');

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    password: passwordSchema,
  }),
};

export const loginSchema = {
  body: z.object({
    phone: phoneSchema,
    password: z.string().min(8).max(72),
  }),
};
