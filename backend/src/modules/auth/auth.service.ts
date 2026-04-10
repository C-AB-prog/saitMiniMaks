import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { signAccessToken } from '../../utils/jwt.js';
import { validatePasswordStrength } from '../../utils/password.js';

export type UserRole = 'USER' | 'ADMIN';

export type SafeUser = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
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
  const pwError = validatePasswordStrength(input.password);
  if (pwError) {
    throw new AppError(pwError, 422);
  }

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
    user: (await getSafeUser(user.id)) as SafeUser
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
    user: (await getSafeUser(user.id)) as SafeUser
  };
};

export const getCurrentUser = async (userId: string) => (await getSafeUser(userId)) as SafeUser;
