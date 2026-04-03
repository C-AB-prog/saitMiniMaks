# Assistant Grows Starter — essential files

## `.env.example`

```example
# backend/.env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-development"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:5173"
UPLOAD_DIR="../uploads"

# frontend/.env
VITE_API_URL="http://localhost:4000/api"

```

## `README.md`

```md
# Assistant Grows Starter

A real full-stack starter refactor of the provided single-file HTML prototype into:

- **frontend**: React + TypeScript + Vite + React Router
- **backend**: Node.js + Express + TypeScript
- **database**: Prisma + SQLite
- **auth**: JWT + bcrypt password hashing
- **uploads**: local image uploads for Focus covers

## Why the date strategy uses `YYYY-MM-DD` strings

Task due dates are intentionally stored as **date-only strings** like `2026-04-02` instead of DateTime timestamps.

That avoids the classic timezone bug where:

- a user selects a calendar day in the browser,
- it gets serialized into UTC,
- then appears one day earlier or later when read back.

Because task due dates are a **calendar concept, not a moment-in-time concept**, this starter keeps them as stable date-only values on both frontend and backend.

## Project structure

```text
assistant-grows-starter/
  backend/
  frontend/
  uploads/
  README.md
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Backend runs on `http://localhost:4000`.

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Uploaded files

Focus cover images are stored inside the top-level `uploads/` folder and served by the backend at `/uploads/<filename>`.

## Core endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### Focus

- `GET /api/focuses`
- `POST /api/focuses`
- `GET /api/focuses/:focusId`
- `PATCH /api/focuses/:focusId`
- `DELETE /api/focuses/:focusId`

### Tasks

- `GET /api/focuses/:focusId/tasks?status=all|completed|incomplete&date=YYYY-MM-DD`
- `POST /api/focuses/:focusId/tasks`
- `PATCH /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId/toggle`
- `DELETE /api/tasks/:taskId`

## Recommended next steps

1. Add refresh tokens and HTTP-only cookies.
2. Add admin module and subscription entities.
3. Add notes and files tables plus signed-upload flow.
4. Add AI chat module with per-Focus conversation history.
5. Move from SQLite to PostgreSQL by changing the Prisma datasource URL and running a new migration strategy.

```

## `backend/.env.example`

```example
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-development"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:5173"
UPLOAD_DIR="../uploads"

```

## `backend/package.json`

```json
{
  "name": "assistant-grows-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.7.4",
    "prisma": "^5.22.0",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2"
  }
}

```

## `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}

```

## `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

model User {
  id           String    @id @default(cuid())
  name         String
  phone        String    @unique
  passwordHash String
  role         UserRole  @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  focuses      Focus[]
}

model Focus {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String
  coverImage  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([userId])
}

model Task {
  id          String   @id @default(cuid())
  focusId      String
  title       String
  description String?
  dueDate     String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  focus       Focus    @relation(fields: [focusId], references: [id], onDelete: Cascade)

  @@index([focusId])
  @@index([dueDate])
  @@index([completed])
}

```

## `backend/src/config/env.ts`

```ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('../uploads')
});

export const env = envSchema.parse(process.env);

```

## `backend/src/config/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

```

## `backend/src/utils/app-error.ts`

```ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

```

## `backend/src/utils/async-handler.ts`

```ts
import type { NextFunction, Request, Response } from 'express';

export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
};

```

## `backend/src/utils/jwt.ts`

```ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthTokenPayload = {
  sub: string;
  role: string;
};

export const signAccessToken = (payload: AuthTokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, subject: payload.sub });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AuthTokenPayload;
};

```

## `backend/src/utils/date.ts`

```ts
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isDateOnly = (value: string) => DATE_ONLY_PATTERN.test(value);

export const compareDateOnly = (left: string, right: string) => left.localeCompare(right);

```

## `backend/src/middleware/auth.middleware.ts`

```ts
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/app-error.js';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: string;
  };
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401));
  }

  try {
    const token = authorization.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    (req as AuthenticatedRequest).user = user;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }
};

```

## `backend/src/middleware/error-handler.ts`

```ts
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error.' });
};

```

## `backend/src/middleware/not-found.ts`

```ts
import type { Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found.' });
};

```

## `backend/src/middleware/upload.middleware.ts`

```ts
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeBaseName = file.originalname
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'focus-cover';

    cb(null, `${safeBaseName}-${Date.now()}${path.extname(file.originalname) || '.jpg'}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError('Only image uploads are allowed.', 400));
      return;
    }
    cb(null, true);
  }
});

```

## `backend/src/middleware/validate.middleware.ts`

```ts
import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';

export const validate = (schema: {
  body?: ZodTypeAny;
  params?: AnyZodObject;
  query?: AnyZodObject;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    next();
  };
};

```

## `backend/src/modules/auth/auth.schemas.ts`

```ts
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

```

## `backend/src/modules/auth/auth.service.ts`

```ts
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { signAccessToken } from '../../utils/jwt.js';

export type SafeUser = {
  id: string;
  name: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
};

const getSafeUser = (userId: string) =>
  prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

export const registerUser = async (input: { name: string; phone: string; password: string }) => {
  const exists = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (exists) {
    throw new AppError('An account with this phone already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      passwordHash
    }
  });

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    user: await getSafeUser(user.id)
  };
};

export const loginUser = async (input: { phone: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (!user) {
    throw new AppError('Invalid phone or password.', 401);
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid phone or password.', 401);
  }

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    user: await getSafeUser(user.id)
  };
};

export const getCurrentUser = async (userId: string) => getSafeUser(userId);

```

## `backend/src/modules/auth/auth.controller.ts`

```ts
import type { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service.js';

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.status(200).json(result);
};

```

## `backend/src/modules/auth/auth.routes.ts`

```ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { login, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(register));
authRouter.post('/login', validate(loginSchema), asyncHandler(login));

```

## `backend/src/modules/users/users.controller.ts`

```ts
import type { Response } from 'express';
import { getCurrentUser } from '../auth/auth.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export const me = async (req: AuthenticatedRequest, res: Response) => {
  const user = await getCurrentUser(req.user.id);
  res.status(200).json(user);
};

```

## `backend/src/modules/users/users.routes.ts`

```ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { me } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, asyncHandler(me));

```

## `backend/src/modules/focus/focus.schemas.ts`

```ts
import { z } from 'zod';

export const focusParamsSchema = {
  params: z.object({
    focusId: z.string().cuid()
  })
};

export const createFocusSchema = {
  body: z.object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(2).max(1000)
  })
};

export const updateFocusSchema = {
  params: z.object({
    focusId: z.string().cuid()
  }),
  body: z.object({
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(2).max(1000).optional()
  })
};

```

## `backend/src/modules/focus/focus.service.ts`

```ts
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';

const focusListInclude = {
  tasks: {
    select: {
      id: true,
      completed: true
    }
  }
} satisfies Prisma.FocusInclude;

export const listUserFocuses = async (userId: string) => {
  const focuses = await prisma.focus.findMany({
    where: { userId },
    include: focusListInclude,
    orderBy: { updatedAt: 'desc' }
  });

  return focuses.map((focus) => ({
    ...focus,
    taskCount: focus.tasks.length,
    completedTaskCount: focus.tasks.filter((task) => task.completed).length,
    tasks: undefined
  }));
};

export const getFocusOrThrow = async (userId: string, focusId: string) => {
  const focus = await prisma.focus.findFirst({
    where: { id: focusId, userId },
    include: {
      tasks: {
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
      }
    }
  });

  if (!focus) {
    throw new AppError('Focus not found.', 404);
  }

  return focus;
};

export const createFocus = async (
  userId: string,
  input: { title: string; description: string; coverImage?: string | null }
) => {
  return prisma.focus.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      coverImage: input.coverImage ?? null
    }
  });
};

export const updateFocus = async (
  userId: string,
  focusId: string,
  input: { title?: string; description?: string; coverImage?: string | null }
) => {
  await getFocusOrThrow(userId, focusId);

  return prisma.focus.update({
    where: { id: focusId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage } : {})
    }
  });
};

export const deleteFocus = async (userId: string, focusId: string) => {
  await getFocusOrThrow(userId, focusId);
  await prisma.focus.delete({ where: { id: focusId } });
};

```

## `backend/src/modules/focus/focus.controller.ts`

```ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createFocus, deleteFocus, getFocusOrThrow, listUserFocuses, updateFocus } from './focus.service.js';

const uploadedPath = (file?: Express.Multer.File) => (file ? `/uploads/${file.filename}` : undefined);

export const listFocuses = async (req: AuthenticatedRequest, res: Response) => {
  const focuses = await listUserFocuses(req.user.id);
  res.status(200).json(focuses);
};

export const getFocus = async (req: AuthenticatedRequest, res: Response) => {
  const focus = await getFocusOrThrow(req.user.id, req.params.focusId);
  res.status(200).json(focus);
};

export const createFocusController = async (req: AuthenticatedRequest, res: Response) => {
  const focus = await createFocus(req.user.id, {
    title: req.body.title,
    description: req.body.description,
    coverImage: uploadedPath(req.file)
  });

  res.status(201).json(focus);
};

export const updateFocusController = async (req: AuthenticatedRequest, res: Response) => {
  const focus = await updateFocus(req.user.id, req.params.focusId, {
    title: req.body.title,
    description: req.body.description,
    coverImage: req.file ? uploadedPath(req.file) : undefined
  });

  res.status(200).json(focus);
};

export const deleteFocusController = async (req: AuthenticatedRequest, res: Response) => {
  await deleteFocus(req.user.id, req.params.focusId);
  res.status(204).send();
};

```

## `backend/src/modules/focus/focus.routes.ts`

```ts
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

```

## `backend/src/modules/tasks/task.schemas.ts`

```ts
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

```

## `backend/src/modules/tasks/task.service.ts`

```ts
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { getFocusOrThrow } from '../focus/focus.service.js';

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
      focus: {
        userId
      }
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

```

## `backend/src/modules/tasks/task.controller.ts`

```ts
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

```

## `backend/src/modules/tasks/task.routes.ts`

```ts
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

```

## `backend/src/app.ts`

```ts
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { focusRouter } from './modules/focus/focus.routes.js';
import { nestedTaskRouter, taskRouter } from './modules/tasks/task.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/focuses', focusRouter);
app.use('/api/focuses/:focusId/tasks', nestedTaskRouter);
app.use('/api/tasks', taskRouter);

app.use(notFoundHandler);
app.use(errorHandler);

```

## `backend/src/server.ts`

```ts
import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`Assistant Grows backend running on http://localhost:${env.PORT}`);
});

```

## `frontend/.env.example`

```example
VITE_API_URL="http://localhost:4000/api"

```

## `frontend/package.json`

```json
{
  "name": "assistant-grows-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-router-dom": "^6.27.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.9",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}

```

## `frontend/tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

## `frontend/tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}

```

## `frontend/tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}

```

## `frontend/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});

```

## `frontend/index.html`

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Assistant Grows</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

## `frontend/src/types/api.ts`

```ts
export type User = {
  id: string;
  name: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type FocusSummary = {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
};

export type Task = {
  id: string;
  focusId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Focus = {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
};

```

## `frontend/src/utils/date.ts`

```ts
export const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Без даты';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short'
  }).format(date);
};

export const isSameDate = (left?: string | null, right?: string | null) => left === right;

export const todayDateString = () => toDateInputValue(new Date());

export const monthMatrix = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ value: string; day: number } | null> = [];

  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ value: toDateInputValue(new Date(year, month, day)), day });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

```

## `frontend/src/api/client.ts`

```ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const parseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const apiClient = async <T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> => {
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError((body as { message?: string })?.message ?? 'Request failed.', response.status, body);
  }

  return body as T;
};

export const fileUrl = (path?: string | null) => {
  if (!path) return null;
  const origin = API_URL.replace(/\/api$/, '');
  return `${origin}${path}`;
};

```

## `frontend/src/api/auth.ts`

```ts
import { apiClient } from './client';
import type { AuthResponse, User } from '../types/api';

export const authApi = {
  register: (payload: { name: string; phone: string; password: string }) =>
    apiClient<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { phone: string; password: string }) =>
    apiClient<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: (token: string) => apiClient<User>('/users/me', { method: 'GET' }, token)
};

```

## `frontend/src/api/focuses.ts`

```ts
import { apiClient } from './client';
import type { Focus, FocusSummary, Task } from '../types/api';

export const focusApi = {
  list: (token: string) => apiClient<FocusSummary[]>('/focuses', { method: 'GET' }, token),
  get: (focusId: string, token: string) => apiClient<Focus>(`/focuses/${focusId}`, { method: 'GET' }, token),
  create: (payload: FormData, token: string) => apiClient<Focus>('/focuses', { method: 'POST', body: payload }, token),
  update: (focusId: string, payload: FormData, token: string) =>
    apiClient<Focus>(`/focuses/${focusId}`, { method: 'PATCH', body: payload }, token),
  remove: (focusId: string, token: string) => apiClient<void>(`/focuses/${focusId}`, { method: 'DELETE' }, token),
  listTasks: (focusId: string, token: string, search = '') =>
    apiClient<Task[]>(`/focuses/${focusId}/tasks${search}`, { method: 'GET' }, token),
  createTask: (focusId: string, payload: { title: string; description?: string; dueDate?: string }, token: string) =>
    apiClient<Task>(`/focuses/${focusId}/tasks`, { method: 'POST', body: JSON.stringify(payload) }, token),
  updateTask: (taskId: string, payload: Partial<Pick<Task, 'title' | 'description' | 'dueDate' | 'completed'>>, token: string) =>
    apiClient<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),
  toggleTask: (taskId: string, token: string) =>
    apiClient<Task>(`/tasks/${taskId}/toggle`, { method: 'PATCH' }, token),
  removeTask: (taskId: string, token: string) => apiClient<void>(`/tasks/${taskId}`, { method: 'DELETE' }, token)
};

```

## `frontend/src/context/AuthContext.tsx`

```tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../types/api';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: { phone: string; password: string }) => Promise<void>;
  register: (payload: { name: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'assistant-grows-token';

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.me(token);
        setUser(currentUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const persistAuth = (nextToken: string, nextUser: User) => {
    localStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login: async (payload) => {
        const response = await authApi.login(payload);
        persistAuth(response.accessToken, response.user);
      },
      register: async (payload) => {
        const response = await authApi.register(payload);
        persistAuth(response.accessToken, response.user);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      }
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
};

```

## `frontend/src/hooks/useAsyncState.ts`

```ts
import { useState } from 'react';

export const useAsyncState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async <T,>(promiseFactory: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      return await promiseFactory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setError,
    wrap
  };
};

```

## `frontend/src/components/ui/Modal.tsx`

```tsx
import { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const Modal = ({ open, title, subtitle, onClose, children, footer }: ModalProps) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="muted-text">{subtitle}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div>{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

```

## `frontend/src/components/ui/EmptyState.tsx`

```tsx
export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="empty-state">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

```

## `frontend/src/components/layout/AppShell.tsx`

```tsx
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ProfileMenu } from '../profile/ProfileMenu';

export const AppShell = () => {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand-mark">
          Assistant Grows
        </Link>
        <nav className="topbar-nav">
          <NavLink to="/app" end className="topbar-link">
            Dashboard
          </NavLink>
        </nav>
        <ProfileMenu />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

```

## `frontend/src/components/profile/ProfileMenu.tsx`

```tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button className="profile-chip" type="button" onClick={() => setOpen(true)}>
        <span className="profile-chip-dot" />
        {user.name}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Профиль"
        subtitle="Личный кабинет пользователя"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={() => setOpen(false)}>
              Закрыть
            </button>
            <button className="button button-primary" type="button" onClick={logout}>
              Выйти
            </button>
          </>
        }
      >
        <div className="profile-grid">
          <div className="stat-card">
            <span className="stat-card-label">Имя</span>
            <strong>{user.name}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Телефон</span>
            <strong>{user.phone}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Роль</span>
            <strong>{user.role}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Регистрация</span>
            <strong>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</strong>
          </div>
        </div>
      </Modal>
    </>
  );
};

```

## `frontend/src/components/focus/FocusCard.tsx`

```tsx
import { Link } from 'react-router-dom';
import { fileUrl } from '../../api/client';
import type { FocusSummary } from '../../types/api';

type FocusCardProps = {
  focus: FocusSummary;
};

export const FocusCard = ({ focus }: FocusCardProps) => {
  const progress = focus.taskCount > 0 ? Math.round((focus.completedTaskCount / focus.taskCount) * 100) : 0;
  const cover = fileUrl(focus.coverImage);

  return (
    <Link to={`/app/focuses/${focus.id}`} className="focus-card-link">
      <article className="focus-card">
        <div
          className="focus-cover"
          style={cover ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.56)), url(${cover})` } : undefined}
        >
          <div className="focus-cover-badge">
            <span>{focus.taskCount} задач</span>
            <strong>{focus.title}</strong>
          </div>
        </div>
        <div className="focus-body">
          <div className="focus-body-top">
            <div>
              <h3>{focus.title}</h3>
              <p>{focus.description}</p>
            </div>
            <span className="status-pill">Активен</span>
          </div>
          <div className="focus-meta-row">
            <span>Открыто: {focus.taskCount - focus.completedTaskCount}</span>
            <span>Выполнено: {focus.completedTaskCount}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </article>
    </Link>
  );
};

```

## `frontend/src/components/focus/FocusFormModal.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Focus, FocusSummary } from '../../types/api';
import { Modal } from '../ui/Modal';
import { fileUrl } from '../../api/client';

type FocusFormValues = {
  title: string;
  description: string;
  coverImage: FileList;
};

type FocusFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialFocus?: Focus | FocusSummary | null;
  onClose: () => void;
  onSubmit: (payload: FormData) => Promise<void>;
};

export const FocusFormModal = ({ open, mode, initialFocus, onClose, onSubmit }: FocusFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FocusFormValues>({
    defaultValues: {
      title: initialFocus?.title ?? '',
      description: initialFocus?.description ?? ''
    }
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFocus?.coverImage ? fileUrl(initialFocus.coverImage) : null);
  const fileList = watch('coverImage');

  useEffect(() => {
    reset({
      title: initialFocus?.title ?? '',
      description: initialFocus?.description ?? ''
    });
    setPreviewUrl(initialFocus?.coverImage ? fileUrl(initialFocus.coverImage) : null);
  }, [initialFocus, reset]);

  useEffect(() => {
    const file = fileList?.item(0);
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [fileList]);

  const submit = handleSubmit(async (values) => {
    const payload = new FormData();
    payload.append('title', values.title);
    payload.append('description', values.description);
    const file = values.coverImage?.item(0);
    if (file) payload.append('coverImage', file);
    await onSubmit(payload);
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Новый Focus' : 'Редактировать Focus'}
      subtitle="Премиальная тёмная рабочая среда для отдельного проекта"
      footer={
        <>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="focus-form" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </>
      }
    >
      <form id="focus-form" className="stack-lg" onSubmit={submit}>
        <label className="field-group">
          <span className="field-label">Название</span>
          <input
            className="text-input"
            placeholder="Например: SaaS продукт"
            {...register('title', { required: 'Введите название.', minLength: 2 })}
          />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Описание</span>
          <textarea
            className="text-area"
            rows={4}
            placeholder="Коротко опишите цель Focus"
            {...register('description', { required: 'Введите описание.', minLength: 2 })}
          />
          {errors.description ? <span className="field-error">{errors.description.message}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Обложка</span>
          <div className="upload-box">
            <div className="focus-preview" style={previewUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.58)), url(${previewUrl})` } : undefined} />
            <input className="text-input" type="file" accept="image/*" {...register('coverImage')} />
            <span className="field-hint">Поддерживается одно изображение до 5 MB.</span>
          </div>
        </label>
      </form>
    </Modal>
  );
};

```

## `frontend/src/components/task/TaskForm.tsx`

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Task } from '../../types/api';

type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
};

type TaskFormProps = {
  initialTask?: Task | null;
  onSubmit: (payload: { title: string; description?: string; dueDate?: string }) => Promise<void>;
  onCancelEdit: () => void;
};

export const TaskForm = ({ initialTask, onSubmit, onCancelEdit }: TaskFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: initialTask?.title ?? '',
      description: initialTask?.description ?? '',
      dueDate: initialTask?.dueDate ?? ''
    }
  });

  useEffect(() => {
    reset({
      title: initialTask?.title ?? '',
      description: initialTask?.description ?? '',
      dueDate: initialTask?.dueDate ?? ''
    });
  }, [initialTask, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate || undefined
    });
    reset({ title: '', description: '', dueDate: '' });
  });

  return (
    <section className="composer-card">
      <div className="composer-header">
        <div>
          <h2>{initialTask ? 'Редактирование задачи' : 'Новая задача'}</h2>
          <p>Стабильная дата хранится как строка YYYY-MM-DD, без timezone-сдвигов.</p>
        </div>
        {initialTask ? (
          <button type="button" className="button button-secondary" onClick={onCancelEdit}>
            Отмена
          </button>
        ) : null}
      </div>
      <form className="composer-grid" onSubmit={submit}>
        <label className="field-group composer-col-span-2">
          <span className="field-label">Название</span>
          <input className="text-input" placeholder="Например: Позвонить 5 клиентам" {...register('title', { required: 'Введите название.' })} />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
        </label>
        <label className="field-group">
          <span className="field-label">Описание</span>
          <textarea className="text-area compact-textarea" rows={1} placeholder="Необязательно" {...register('description')} />
        </label>
        <label className="field-group">
          <span className="field-label">Дата</span>
          <input className="text-input date-input" type="date" {...register('dueDate')} />
        </label>
        <div className="composer-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : initialTask ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </section>
  );
};

```

## `frontend/src/components/task/TaskList.tsx`

```tsx
import { formatDateLabel } from '../../utils/date';
import type { Task } from '../../types/api';
import { EmptyState } from '../ui/EmptyState';

type TaskListProps = {
  tasks: Task[];
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export const TaskList = ({ tasks, onToggle, onEdit, onDelete }: TaskListProps) => {
  if (!tasks.length) {
    return <EmptyState title="Задач пока нет" description="Создайте первую задачу для этого Focus или измените фильтр." />;
  }

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const renderTaskCard = (task: Task) => (
    <article key={task.id} className={`task-card ${task.completed ? 'is-complete' : ''}`}>
      <div className="task-card-top">
        <button className={`checkbox-pill ${task.completed ? 'is-complete' : ''}`} type="button" onClick={() => void onToggle(task.id)}>
          {task.completed ? '✓' : ''}
        </button>
        <div className="task-copy">
          <h3>{task.title}</h3>
          {task.description ? <p>{task.description}</p> : null}
        </div>
        <div className="task-actions">
          <button className="button button-secondary button-small" type="button" onClick={() => onEdit(task)}>
            Редактировать
          </button>
          <button className="button button-danger button-small" type="button" onClick={() => onDelete(task)}>
            Удалить
          </button>
        </div>
      </div>
      <div className="task-meta-row">
        <span>📅 {formatDateLabel(task.dueDate)}</span>
        <span>{task.completed ? '✅ Выполнено' : '⚡ В работе'}</span>
      </div>
    </article>
  );

  return (
    <div className="task-columns">
      <section className="task-section-card">
        <div className="section-row">
          <div>
            <h3>Активные</h3>
            <p className="muted-text">Текущие рабочие задачи</p>
          </div>
          <span className="count-pill">{activeTasks.length}</span>
        </div>
        <div className="stack-md">{activeTasks.map(renderTaskCard)}</div>
      </section>

      <section className="task-section-card">
        <div className="section-row">
          <div>
            <h3>Выполненные</h3>
            <p className="muted-text">Уже закрытые задачи</p>
          </div>
          <span className="count-pill">{completedTasks.length}</span>
        </div>
        <div className="stack-md">
          {completedTasks.length ? completedTasks.map(renderTaskCard) : <EmptyState title="Пока пусто" description="Здесь появятся завершённые задачи." />}
        </div>
      </section>
    </div>
  );
};

```

## `frontend/src/components/task/CalendarSidebar.tsx`

```tsx
import { monthMatrix, todayDateString } from '../../utils/date';
import type { Task } from '../../types/api';

type CalendarSidebarProps = {
  month: number;
  year: number;
  selectedDate: string | null;
  tasks: Task[];
  onChangeMonth: (delta: number) => void;
  onSelectDate: (date: string | null) => void;
};

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const CalendarSidebar = ({ month, year, selectedDate, tasks, onChangeMonth, onSelectDate }: CalendarSidebarProps) => {
  const matrix = monthMatrix(year, month);
  const today = todayDateString();
  const taskMap = new Map<string, { total: number; completed: number }>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const next = taskMap.get(task.dueDate) ?? { total: 0, completed: 0 };
    next.total += 1;
    if (task.completed) next.completed += 1;
    taskMap.set(task.dueDate, next);
  }

  return (
    <aside className="calendar-card">
      <div className="calendar-head">
        <h3>{new Date(year, month, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</h3>
        <div className="calendar-nav-row">
          <button className="icon-button" type="button" onClick={() => onChangeMonth(-1)}>
            ‹
          </button>
          <button className="button button-secondary button-small" type="button" onClick={() => onSelectDate(today)}>
            Сегодня
          </button>
          <button className="icon-button" type="button" onClick={() => onChangeMonth(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="calendar-grid-wrap">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {matrix.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} className="calendar-cell empty" />;
          const stat = taskMap.get(cell.value);
          const classNames = ['calendar-cell'];
          if (cell.value === today) classNames.push('today');
          if (selectedDate === cell.value) classNames.push('selected');
          if (stat?.total) classNames.push(stat.completed === stat.total ? 'all-done' : 'has-tasks');

          return (
            <button key={cell.value} className={classNames.join(' ')} type="button" onClick={() => onSelectDate(cell.value)}>
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend-row">
        <button className="button button-secondary button-small" type="button" onClick={() => onSelectDate(null)}>
          Показать все даты
        </button>
      </div>
    </aside>
  );
};

```

## `frontend/src/pages/LandingPage.tsx`

```tsx
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Система фокусов',
    description: 'Изолированные рабочие пространства для каждого проекта без смешивания контекста.'
  },
  {
    title: 'AI-ready основа',
    description: 'Архитектура уже готова к будущему AI-чату, заметкам и файлам внутри Focus.'
  },
  {
    title: 'Премиальный тёмный UX',
    description: 'Визуальный язык сохранён из прототипа: стекло, мягкие карточки, глубокий контраст и аккуратные анимации.'
  }
];

export const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <Link to="/" className="brand-mark">
          Assistant Grows
        </Link>
        <div className="topbar-actions">
          <Link className="button button-secondary" to="/login">
            Войти
          </Link>
          <Link className="button button-primary" to="/register">
            Начать
          </Link>
        </div>
      </header>

      <section className="hero-panel">
        <span className="eyebrow-badge">AI-Powered Business Growth Platform</span>
        <h1>Строй бизнес с AI-наставником</h1>
        <p>
          Assistant Grows — это премиальная рабочая система, где каждый Focus получает собственный контекст,
          задачи, обложку и основу для следующего этапа с AI.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/register">
            Создать аккаунт
          </Link>
          <Link className="button button-secondary" to="/login">
            Уже есть аккаунт
          </Link>
        </div>
      </section>

      <section className="feature-grid-section">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card-panel">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

```

## `frontend/src/pages/LoginPage.tsx`

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type LoginValues = {
  phone: string;
  password: string;
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>();

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      navigate('/app');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось войти.');
    }
  });

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-header">
          <Link to="/" className="brand-mark center-brand">
            Assistant Grows
          </Link>
          <h1>Вход</h1>
          <p>Войдите по телефону и паролю.</p>
        </div>

        <label className="field-group">
          <span className="field-label">Телефон</span>
          <input className="text-input" placeholder="+79991234567" {...register('phone', { required: 'Введите телефон.' })} />
          {errors.phone ? <span className="field-error">{errors.phone.message}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Пароль</span>
          <input className="text-input" type="password" placeholder="Минимум 8 символов" {...register('password', { required: 'Введите пароль.' })} />
          {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
        </label>

        {error ? <div className="notice notice-error">{error}</div> : null}

        <button className="button button-primary button-block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Входим...' : 'Войти'}
        </button>

        <p className="auth-footer-text">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
};

```

## `frontend/src/pages/RegisterPage.tsx`

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type RegisterValues = {
  name: string;
  phone: string;
  password: string;
};

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>();

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await registerUser(values);
      navigate('/app');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось зарегистрироваться.');
    }
  });

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-header">
          <Link to="/" className="brand-mark center-brand">
            Assistant Grows
          </Link>
          <h1>Регистрация</h1>
          <p>Имя, телефон и пароль — без SMS на этом этапе.</p>
        </div>

        <label className="field-group">
          <span className="field-label">Имя</span>
          <input className="text-input" placeholder="Например: Дмитрий" {...register('name', { required: 'Введите имя.' })} />
          {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Телефон</span>
          <input className="text-input" placeholder="+79991234567" {...register('phone', { required: 'Введите телефон.' })} />
          {errors.phone ? <span className="field-error">{errors.phone.message}</span> : null}
        </label>

        <label className="field-group">
          <span className="field-label">Пароль</span>
          <input className="text-input" type="password" placeholder="Минимум 8 символов" {...register('password', { required: 'Введите пароль.', minLength: 8 })} />
          {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
        </label>

        {error ? <div className="notice notice-error">{error}</div> : null}

        <button className="button button-primary button-block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Создаём...' : 'Создать аккаунт'}
        </button>

        <p className="auth-footer-text">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
};

```

## `frontend/src/pages/DashboardPage.tsx`

```tsx
import { useEffect, useMemo, useState } from 'react';
import { focusApi } from '../api/focuses';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { FocusSummary } from '../types/api';
import { FocusCard } from '../components/focus/FocusCard';
import { FocusFormModal } from '../components/focus/FocusFormModal';
import { EmptyState } from '../components/ui/EmptyState';

export const DashboardPage = () => {
  const { token, user } = useAuth();
  const { isLoading, error, setError, wrap } = useAsyncState();
  const [focuses, setFocuses] = useState<FocusSummary[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadFocuses = async () => {
    if (!token) return;
    const response = await wrap(() => focusApi.list(token));
    setFocuses(response);
  };

  useEffect(() => {
    void loadFocuses();
  }, [token]);

  const totals = useMemo(() => {
    return focuses.reduce(
      (acc, focus) => {
        acc.focusCount += 1;
        acc.completed += focus.completedTaskCount;
        acc.open += Math.max(0, focus.taskCount - focus.completedTaskCount);
        return acc;
      },
      { focusCount: 0, completed: 0, open: 0 }
    );
  }, [focuses]);

  return (
    <div className="page-stack">
      <section className="dashboard-hero-panel">
        <h1>
          Ваши Focus
          <small>{user ? `${user.name} · ${user.phone}` : 'Рабочая система для проектов'}</small>
        </h1>
        <p>Создавайте отдельные пространства, ведите задачи и управляйте ростом без хаоса.</p>
        <div className="hero-actions">
          <button className="button button-primary button-large" type="button" onClick={() => setIsCreateOpen(true)}>
            Создать новый Focus
          </button>
        </div>
      </section>

      <section className="page-stack">
        <div className="stats-grid">
          <article className="stat-card compact-card">
            <span className="stat-card-label">Всего Focus</span>
            <strong>{totals.focusCount}</strong>
          </article>
          <article className="stat-card compact-card">
            <span className="stat-card-label">Открытых задач</span>
            <strong>{totals.open}</strong>
          </article>
          <article className="stat-card compact-card">
            <span className="stat-card-label">Выполнено</span>
            <strong>{totals.completed}</strong>
          </article>
        </div>

        {error ? <div className="notice notice-error">{error}</div> : null}

        {isLoading ? <div className="loading-card">Загружаем Focus...</div> : null}

        {!isLoading && !focuses.length ? (
          <EmptyState
            title="Пока нет ни одного Focus"
            description="Создайте первое рабочее пространство и начните наполнять его задачами."
          />
        ) : null}

        <div className="focus-grid-layout">
          {focuses.map((focus) => (
            <FocusCard key={focus.id} focus={focus} />
          ))}
        </div>
      </section>

      <FocusFormModal
        open={isCreateOpen}
        mode="create"
        onClose={() => {
          setError(null);
          setIsCreateOpen(false);
        }}
        onSubmit={async (payload) => {
          if (!token) return;
          await wrap(() => focusApi.create(payload, token));
          await loadFocuses();
        }}
      />
    </div>
  );
};

```

## `frontend/src/pages/FocusDetailsPage.tsx`

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { focusApi } from '../api/focuses';
import { fileUrl } from '../api/client';
import { FocusFormModal } from '../components/focus/FocusFormModal';
import { CalendarSidebar } from '../components/task/CalendarSidebar';
import { TaskForm } from '../components/task/TaskForm';
import { TaskList } from '../components/task/TaskList';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { Focus, Task } from '../types/api';

export const FocusDetailsPage = () => {
  const { focusId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, error, setError, wrap } = useAsyncState();
  const [focus, setFocus] = useState<Focus | null>(null);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [isFocusEditOpen, setIsFocusEditOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isFocusDeleteOpen, setIsFocusDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const loadFocus = async () => {
    if (!token || !focusId) return;
    const response = await wrap(() => focusApi.get(focusId, token));
    setFocus(response);
  };

  useEffect(() => {
    void loadFocus();
  }, [focusId, token]);

  const filteredTasks = useMemo(() => {
    if (!focus) return [];
    return focus.tasks.filter((task) => {
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'incomplete' && task.completed) return false;
      if (selectedDate && task.dueDate !== selectedDate) return false;
      return true;
    });
  }, [focus, statusFilter, selectedDate]);

  const coverImage = fileUrl(focus?.coverImage);
  const completedCount = focus?.tasks.filter((task) => task.completed).length ?? 0;
  const progress = focus?.tasks.length ? Math.round((completedCount / focus.tasks.length) * 100) : 0;

  if (isLoading && !focus) return <div className="loading-card">Загружаем Focus...</div>;
  if (!focus) return <div className="notice notice-error">{error ?? 'Focus не найден.'}</div>;

  return (
    <div className="page-stack">
      <section className="focus-hero-card">
        <div
          className="focus-hero-cover"
          style={coverImage ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.76)), url(${coverImage})` } : undefined}
        />
        <div className="focus-hero-content">
          <div>
            <Link className="back-link" to="/app">
              ← Назад к dashboard
            </Link>
            <h1>{focus.title}</h1>
            <p>{focus.description}</p>
            <div className="inline-chip-row">
              <span className="focus-chip">{focus.tasks.length} задач</span>
              <span className="focus-chip">{completedCount} выполнено</span>
              <span className="focus-chip">{progress}% прогресс</span>
            </div>
          </div>
          <div className="focus-hero-actions">
            <button className="button button-secondary" type="button" onClick={() => setIsFocusEditOpen(true)}>
              Редактировать
            </button>
            <button className="button button-danger" type="button" onClick={() => setIsFocusDeleteOpen(true)}>
              Удалить
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="focus-layout-grid">
        <div className="page-stack">
          <TaskForm
            initialTask={taskBeingEdited}
            onCancelEdit={() => setTaskBeingEdited(null)}
            onSubmit={async (payload) => {
              if (!token || !focusId) return;
              if (taskBeingEdited) {
                await wrap(() => focusApi.updateTask(taskBeingEdited.id, payload, token));
                setTaskBeingEdited(null);
              } else {
                await wrap(() => focusApi.createTask(focusId, payload, token));
              }
              await loadFocus();
            }}
          />

          <section className="task-section-card">
            <div className="filter-row">
              <div className="filter-button-group">
                {(['all', 'completed', 'incomplete'] as const).map((filter) => (
                  <button
                    key={filter}
                    className={`filter-button ${statusFilter === filter ? 'active' : ''}`}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter === 'all' ? 'Все' : filter === 'completed' ? 'Выполненные' : 'Активные'}
                  </button>
                ))}
              </div>
              {selectedDate ? (
                <button className="button button-secondary button-small" type="button" onClick={() => setSelectedDate(null)}>
                  Сбросить дату
                </button>
              ) : null}
            </div>
            <TaskList
              tasks={filteredTasks}
              onToggle={async (taskId) => {
                if (!token) return;
                await wrap(() => focusApi.toggleTask(taskId, token));
                await loadFocus();
              }}
              onEdit={(task) => setTaskBeingEdited(task)}
              onDelete={(task) => setTaskToDelete(task)}
            />
          </section>
        </div>

        <div className="page-stack">
          <CalendarSidebar
            month={calendarDate.month}
            year={calendarDate.year}
            selectedDate={selectedDate}
            tasks={focus.tasks}
            onChangeMonth={(delta) => {
              setCalendarDate((prev) => {
                const next = new Date(prev.year, prev.month + delta, 1);
                return { month: next.getMonth(), year: next.getFullYear() };
              });
            }}
            onSelectDate={setSelectedDate}
          />

          <section className="overview-panel">
            <h3>Overview</h3>
            <div className="stats-grid two-columns">
              <article className="stat-card compact-card">
                <span className="stat-card-label">Открыто</span>
                <strong>{focus.tasks.length - completedCount}</strong>
              </article>
              <article className="stat-card compact-card">
                <span className="stat-card-label">Выполнено</span>
                <strong>{completedCount}</strong>
              </article>
            </div>
            <p className="muted-text">
              Notes, files and AI chat intentionally left future-ready. The starter keeps their UX direction but focuses this version on a stable core.
            </p>
          </section>
        </div>
      </div>

      <FocusFormModal
        open={isFocusEditOpen}
        mode="edit"
        initialFocus={focus}
        onClose={() => setIsFocusEditOpen(false)}
        onSubmit={async (payload) => {
          if (!token || !focusId) return;
          await wrap(() => focusApi.update(focusId, payload, token));
          await loadFocus();
        }}
      />

      <Modal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Удалить задачу"
        subtitle="Это действие нельзя отменить"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={() => setTaskToDelete(null)}>
              Отмена
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={async () => {
                if (!taskToDelete || !token) return;
                await wrap(() => focusApi.removeTask(taskToDelete.id, token));
                setTaskToDelete(null);
                await loadFocus();
              }}
            >
              Удалить
            </button>
          </>
        }
      >
        <p className="muted-text">Задача «{taskToDelete?.title}» будет удалена из этого Focus.</p>
      </Modal>

      <Modal
        open={isFocusDeleteOpen}
        onClose={() => setIsFocusDeleteOpen(false)}
        title="Удалить Focus"
        subtitle="Все задачи внутри тоже будут удалены"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={() => setIsFocusDeleteOpen(false)}>
              Отмена
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={async () => {
                if (!token || !focusId) return;
                await wrap(() => focusApi.remove(focusId, token));
                navigate('/app');
              }}
            >
              Удалить Focus
            </button>
          </>
        }
      >
        <p className="muted-text">После удаления восстановить Focus уже не получится.</p>
      </Modal>
    </div>
  );
};

```

## `frontend/src/app/ProtectedRoute.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Проверяем сессию...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
};

```

## `frontend/src/app/router.tsx`

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { FocusDetailsPage } from '../pages/FocusDetailsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />
          },
          {
            path: 'focuses/:focusId',
            element: <FocusDetailsPage />
          }
        ]
      }
    ]
  }
]);

```

## `frontend/src/app/App.tsx`

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export const App = () => <RouterProvider router={router} />;

```

## `frontend/src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { AuthProvider } from './context/AuthContext';
import './styles/theme.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/forms.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

```

## `frontend/src/styles/theme.css`

```css
:root {
  color-scheme: dark;
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #111111;
  --bg-card: #17171a;
  --bg-card-soft: rgba(20, 20, 24, 0.92);
  --bg-hover: #222226;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a8;
  --text-tertiary: #6d6d75;
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.06);
  --accent-primary: #0a84ff;
  --accent-secondary: #64d2ff;
  --accent-gradient: linear-gradient(135deg, #0a84ff 0%, #64d2ff 100%);
  --danger: #ff453a;
  --success: #30d158;
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.28);
  --shadow-large: 0 20px 60px rgba(0, 0, 0, 0.42);
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-xl: 28px;
  --content-width: 1280px;
  --transition: all 0.22s ease;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
}

```

## `frontend/src/styles/base.css`

```css
* { box-sizing: border-box; }
html, body, #root { min-height: 100%; }
body {
  margin: 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(10, 132, 255, 0.12), transparent 30%),
    radial-gradient(circle at 100% 20%, rgba(100, 210, 255, 0.08), transparent 25%),
    var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}
a { color: inherit; text-decoration: none; }
button, input, textarea, select { font: inherit; }
img { display: block; max-width: 100%; }

```

## `frontend/src/styles/layout.css`

```css
.app-shell {
  min-height: 100vh;
}
.topbar,
.landing-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.72);
  border-bottom: 1px solid var(--border-secondary);
}
.brand-mark {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.center-brand { display: inline-flex; justify-content: center; width: 100%; }
.topbar-nav, .topbar-actions, .hero-actions, .focus-hero-actions, .inline-chip-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.topbar-link { color: var(--text-secondary); }
.topbar-link.active { color: var(--text-primary); }
.app-main, .landing-page {
  width: min(100%, calc(var(--content-width) + 56px));
  margin: 0 auto;
  padding: 32px 28px 64px;
}
.page-stack { display: grid; gap: 20px; }
.hero-panel, .dashboard-hero-panel, .focus-hero-card, .overview-panel, .loading-card {
  background: linear-gradient(180deg, rgba(24, 24, 28, 0.96), rgba(14, 14, 18, 0.92));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}
.hero-panel, .dashboard-hero-panel {
  padding: 72px 28px;
  text-align: center;
}
.hero-panel h1, .dashboard-hero-panel h1, .focus-hero-content h1 { margin: 0 0 12px; font-size: clamp(38px, 6vw, 72px); line-height: 1.05; letter-spacing: -0.04em; }
.dashboard-hero-panel h1 small { display: block; margin-top: 8px; font-size: 18px; color: var(--text-secondary); font-weight: 500; }
.hero-panel p, .dashboard-hero-panel p { max-width: 780px; margin: 0 auto 28px; color: var(--text-secondary); font-size: 18px; }
.eyebrow-badge {
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 24px; padding: 8px 16px; border-radius: 999px;
  border: 1px solid rgba(10,132,255,.22); color: var(--accent-secondary); background: rgba(10,132,255,.08);
  font-size: 13px; font-weight: 600;
}
.feature-grid-section, .focus-grid-layout, .stats-grid, .focus-layout-grid, .profile-grid {
  display: grid; gap: 18px;
}
.feature-grid-section { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.focus-grid-layout { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.stats-grid.two-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.focus-layout-grid { grid-template-columns: minmax(0, 1.15fr) 360px; align-items: start; }
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.auth-card {
  width: min(100%, 460px);
  padding: 36px;
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, rgba(24,24,29,.97), rgba(14,14,18,.95));
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-large);
}
.auth-header { display: grid; gap: 8px; margin-bottom: 24px; text-align: center; }
.auth-header h1 { margin: 0; }
.auth-header p, .auth-footer-text { color: var(--text-secondary); }
.focus-hero-card { overflow: hidden; }
.focus-hero-cover { height: 220px; background-color: #111; background-size: cover; background-position: center; }
.focus-hero-content { display: flex; justify-content: space-between; gap: 20px; padding: 24px 28px 28px; }
.focus-chip, .status-pill {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 999px;
  border: 1px solid var(--border-primary); background: rgba(255,255,255,.04); color: var(--text-secondary); font-size: 13px;
}
.status-pill { color: var(--success); }
.back-link { color: var(--text-secondary); display: inline-block; margin-bottom: 12px; }
.overview-panel { padding: 20px; }
.loading-card { padding: 24px; }
@media (max-width: 1024px) {
  .feature-grid-section, .focus-layout-grid, .stats-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .topbar, .landing-topbar, .app-main, .landing-page { padding-left: 18px; padding-right: 18px; }
  .hero-panel, .dashboard-hero-panel { padding: 56px 20px; }
  .focus-hero-content { flex-direction: column; }
}

```

## `frontend/src/styles/forms.css`

```css
.stack-lg { display: grid; gap: 18px; }
.field-group { display: grid; gap: 8px; }
.field-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.field-hint { font-size: 12px; color: var(--text-tertiary); }
.field-error { font-size: 12px; color: #ff8f88; }
.text-input, .text-area, .date-input {
  width: 100%;
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 14px 16px;
  transition: var(--transition);
}
.text-area { resize: vertical; min-height: 112px; }
.compact-textarea { min-height: 54px; }
.text-input:focus, .text-area:focus, .date-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.1);
}
.upload-box { display: grid; gap: 12px; padding: 14px; border: 1px dashed var(--border-primary); border-radius: 18px; background: rgba(255,255,255,.02); }
.focus-preview { height: 190px; border-radius: 18px; border: 1px solid var(--border-primary); background: linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.58)), var(--bg-secondary); background-size: cover; background-position: center; }
.button {
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: var(--transition);
  min-height: 46px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.button:hover { transform: translateY(-1px); }
.button-primary { color: white; background: var(--accent-gradient); box-shadow: 0 10px 24px rgba(10,132,255,.24); }
.button-secondary { color: var(--text-primary); background: var(--bg-card); border: 1px solid var(--border-primary); }
.button-danger { color: #ffb2ac; background: rgba(255,69,58,.1); border: 1px solid rgba(255,69,58,.25); }
.button-small { min-height: 38px; padding: 0 12px; font-size: 13px; }
.button-large { min-height: 56px; padding: 0 28px; font-size: 16px; }
.button-block { width: 100%; }
.icon-button {
  width: 40px; height: 40px; border-radius: 14px; border: 1px solid var(--border-primary);
  background: var(--bg-secondary); color: var(--text-primary); cursor: pointer;
}
.notice {
  padding: 14px 16px; border-radius: 16px; border: 1px solid transparent;
}
.notice-error { background: rgba(255,69,58,.09); border-color: rgba(255,69,58,.18); color: #ffb2ac; }

```

## `frontend/src/styles/components.css`

```css
.feature-card-panel, .stat-card, .focus-card, .composer-card, .task-section-card, .calendar-card, .task-card, .empty-state, .modal-card {
  background: linear-gradient(180deg, rgba(24,24,29,.96), rgba(14,14,18,.92));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
}
.feature-card-panel, .stat-card, .task-section-card, .calendar-card, .empty-state { padding: 20px; }
.feature-card-panel h3, .task-card h3, .focus-body h3, .task-section-card h3, .overview-panel h3 { margin: 0 0 8px; }
.feature-card-panel p, .focus-body p, .task-card p, .muted-text, .empty-state p { color: var(--text-secondary); }
.empty-state h3 { margin: 0 0 8px; }
.compact-card strong, .stat-card strong { font-size: 32px; line-height: 1; }
.stat-card-label { display: block; margin-bottom: 8px; font-size: 13px; color: var(--text-tertiary); }
.focus-card-link { display: block; }
.focus-card { overflow: hidden; }
.focus-cover { position: relative; height: 208px; background: linear-gradient(180deg, rgba(10,10,12,.6), rgba(10,10,12,.92)); background-size: cover; background-position: center; }
.focus-cover-badge {
  position: absolute; left: 16px; right: 16px; bottom: 16px;
  display: flex; justify-content: space-between; gap: 12px; align-items: center;
  padding: 12px 14px; border-radius: 16px; background: rgba(8, 8, 10, 0.58); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px);
}
.focus-cover-badge span { color: rgba(255,255,255,.72); font-size: 12px; }
.focus-cover-badge strong { font-size: 16px; }
.focus-body { padding: 20px; }
.focus-body-top { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.focus-meta-row, .task-meta-row, .section-row, .filter-row, .modal-header-row, .calendar-head, .task-card-top, .composer-header, .calendar-nav-row, .modal-footer { display: flex; align-items: center; gap: 12px; }
.focus-meta-row, .task-meta-row { flex-wrap: wrap; color: var(--text-tertiary); font-size: 13px; }
.section-row, .filter-row, .modal-header-row, .calendar-head, .task-card-top, .composer-header { justify-content: space-between; }
.progress-track { height: 6px; border-radius: 999px; background: rgba(255,255,255,.06); overflow: hidden; margin-top: 16px; }
.progress-fill { height: 100%; background: var(--accent-gradient); }
.profile-chip {
  min-height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--border-primary);
  background: var(--bg-card); color: var(--text-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 10px;
}
.profile-chip-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent-secondary); box-shadow: 0 0 0 5px rgba(100,210,255,.12); }
.composer-card { padding: 20px; }
.composer-grid { display: grid; grid-template-columns: 1.6fr 1fr 180px; gap: 14px; align-items: end; }
.composer-col-span-2 { grid-column: span 2; }
.composer-actions { display: flex; align-items: end; justify-content: flex-end; }
.task-columns { display: grid; gap: 18px; }
.count-pill {
  min-width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--bg-secondary); border: 1px solid var(--border-primary); color: var(--text-primary); font-size: 13px; font-weight: 700;
}
.filter-button-group { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-button {
  min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--border-primary);
  background: var(--bg-card); color: var(--text-secondary); cursor: pointer;
}
.filter-button.active { color: var(--text-primary); border-color: var(--accent-primary); background: rgba(10,132,255,.1); }
.task-card { padding: 18px; }
.task-copy { flex: 1; min-width: 0; }
.task-copy h3 { font-size: 16px; }
.task-copy p { margin: 4px 0 0; }
.checkbox-pill {
  width: 24px; height: 24px; border-radius: 8px; border: 1px solid var(--border-primary); background: var(--bg-secondary); color: black; cursor: pointer;
}
.checkbox-pill.is-complete { background: var(--success); border-color: var(--success); font-weight: 800; }
.task-card.is-complete .task-copy h3 { text-decoration: line-through; color: var(--text-secondary); }
.task-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.calendar-card { padding: 20px; position: sticky; top: 94px; }
.calendar-grid-wrap {
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: 14px;
}
.calendar-weekday { text-align: center; color: var(--text-tertiary); font-size: 12px; padding: 6px 0; }
.calendar-cell {
  min-height: 40px; border-radius: 12px; border: 1px solid transparent; background: rgba(255,255,255,.03); color: var(--text-primary); cursor: pointer;
}
.calendar-cell.empty { visibility: hidden; }
.calendar-cell.today { border-color: rgba(10,132,255,.45); }
.calendar-cell.selected { background: rgba(10,132,255,.18); border-color: rgba(10,132,255,.55); }
.calendar-cell.has-tasks { box-shadow: inset 0 -3px 0 rgba(10,132,255,.9); }
.calendar-cell.all-done { box-shadow: inset 0 -3px 0 rgba(48,209,88,.9); }
.calendar-legend-row { margin-top: 16px; }
.modal-backdrop {
  position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 24px;
  background: rgba(0,0,0,.74); backdrop-filter: blur(14px);
}
.modal-card { width: min(100%, 560px); padding: 24px; }
.modal-header-row h3 { margin: 0 0 4px; }
.modal-footer { justify-content: flex-end; margin-top: 20px; }
.loading-screen { min-height: 100vh; display: grid; place-items: center; color: var(--text-secondary); }
@media (max-width: 1024px) {
  .composer-grid { grid-template-columns: 1fr; }
  .composer-col-span-2 { grid-column: span 1; }
  .calendar-card { position: static; }
}
@media (max-width: 768px) {
  .focus-body-top, .task-card-top, .filter-row, .modal-header-row, .modal-footer { flex-direction: column; align-items: stretch; }
  .task-actions .button-small { flex: 1; }
}

```
