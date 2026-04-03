import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { login, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(register));
authRouter.post('/login', validate(loginSchema), asyncHandler(login));
