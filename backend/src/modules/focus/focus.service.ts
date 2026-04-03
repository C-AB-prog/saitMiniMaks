import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';

const focusAccessWhere = (userId: string): Prisma.FocusWhereInput => ({
  OR: [{ userId }, { members: { some: { userId } } }]
});

const memberInclude = {
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  }
} satisfies Prisma.FocusMemberInclude;

const focusListInclude = {
  tasks: {
    select: {
      id: true,
      completed: true
    }
  },
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  },
  members: {
    include: memberInclude,
    orderBy: {
      createdAt: 'asc'
    }
  }
} satisfies Prisma.FocusInclude;

const focusDetailsInclude = {
  tasks: {
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
  },
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  },
  members: {
    include: memberInclude,
    orderBy: {
      createdAt: 'asc'
    }
  }
} satisfies Prisma.FocusInclude;

const normalizePhone = (value: string) => value.replace(/\D/g, '');

const normalizePhoneForLookup = (value: string) => {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  return value.trim();
};

const sanitizePhones = (phones: string[] = []) =>
  Array.from(new Set(phones.map(normalizePhoneForLookup).filter(Boolean)));

const mapFocus = <T extends { userId: string; user: unknown; members: Array<{ user: unknown }>; tasks?: Array<{ completed: boolean }> }>(
  focus: T,
  currentUserId: string
) => ({
  ...focus,
  accessRole: focus.userId === currentUserId ? 'owner' : 'member',
  owner: focus.user,
  members: focus.members.map((member) => member.user),
  collaboratorCount: focus.members.length,
  taskCount: focus.tasks?.length,
  completedTaskCount: focus.tasks?.filter((task) => task.completed).length
});

const resolveCollaboratorIds = async (ownerUserId: string, phones: string[]) => {
  const normalizedPhones = sanitizePhones(phones);
  if (!normalizedPhones.length) {
    return [] as string[];
  }

  const users = await prisma.user.findMany({
    where: { phone: { in: normalizedPhones } },
    select: { id: true, phone: true }
  });

  const missingPhones = normalizedPhones.filter((phone) => !users.some((user) => user.phone === phone));
  if (missingPhones.length) {
    throw new AppError(`These phone numbers are not registered yet: ${missingPhones.join(', ')}`, 400);
  }

  return users.map((user) => user.id).filter((userId) => userId !== ownerUserId);
};

export const listUserFocuses = async (userId: string) => {
  const focuses = await prisma.focus.findMany({
    where: focusAccessWhere(userId),
    include: focusListInclude,
    orderBy: { updatedAt: 'desc' }
  });

  return focuses.map((focus) => {
    const mapped = mapFocus(focus, userId);
    return {
      ...mapped,
      tasks: undefined
    };
  });
};

export const getFocusOrThrow = async (userId: string, focusId: string) => {
  const focus = await prisma.focus.findFirst({
    where: {
      id: focusId,
      ...focusAccessWhere(userId)
    },
    include: focusDetailsInclude
  });

  if (!focus) {
    throw new AppError('Focus not found.', 404);
  }

  return mapFocus(focus, userId);
};

export const createFocus = async (
  userId: string,
  input: { title: string; description: string; coverImage?: string | null; collaboratorPhones?: string[] }
) => {
  const collaboratorIds = await resolveCollaboratorIds(userId, input.collaboratorPhones ?? []);

  const focus = await prisma.focus.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      coverImage: input.coverImage ?? null,
      members: collaboratorIds.length
        ? {
            create: collaboratorIds.map((collaboratorId) => ({
              userId: collaboratorId,
              addedByUserId: userId
            }))
          }
        : undefined
    },
    include: focusDetailsInclude
  });

  return mapFocus(focus, userId);
};

export const updateFocus = async (
  userId: string,
  focusId: string,
  input: { title?: string; description?: string; coverImage?: string | null; collaboratorPhones?: string[] }
) => {
  const existingFocus = await getFocusOrThrow(userId, focusId);

  if (existingFocus.userId !== userId) {
    throw new AppError('Only the focus owner can edit members.', 403);
  }

  const collaboratorIds = input.collaboratorPhones ? await resolveCollaboratorIds(userId, input.collaboratorPhones) : undefined;

  const focus = await prisma.focus.update({
    where: { id: focusId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage } : {}),
      ...(collaboratorIds !== undefined
        ? {
            members: {
              deleteMany: {},
              ...(collaboratorIds.length
                ? {
                    create: collaboratorIds.map((collaboratorId) => ({
                      userId: collaboratorId,
                      addedByUserId: userId
                    }))
                  }
                : {})
            }
          }
        : {})
    },
    include: focusDetailsInclude
  });

  return mapFocus(focus, userId);
};

export const deleteFocus = async (userId: string, focusId: string) => {
  const focus = await getFocusOrThrow(userId, focusId);
  if (focus.userId !== userId) {
    throw new AppError('Only the focus owner can delete this focus.', 403);
  }
  await prisma.focus.delete({ where: { id: focusId } });
};

export const canManageFocus = async (userId: string, focusId: string) => {
  const focus = await prisma.focus.findFirst({
    where: { id: focusId, userId },
    select: { id: true }
  });

  return Boolean(focus);
};

export const getTaskAccessWhere = (userId: string): Prisma.TaskWhereInput => ({
  focus: focusAccessWhere(userId)
});
