export type User = {
  id: string;
  name: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
};

export type FocusAccessRole = 'owner' | 'member';

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
  collaboratorCount: number;
  accessRole: FocusAccessRole;
  owner: User;
  members: User[];
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
  collaboratorCount: number;
  accessRole: FocusAccessRole;
  owner: User;
  members: User[];
};
