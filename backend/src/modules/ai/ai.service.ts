import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { getFocusOrThrow } from '../focus/focus.service.js';

const MAX_HISTORY_MESSAGES = 14;

const clip = (value: string, max = 220) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const buildFocusContext = (focus: Awaited<ReturnType<typeof getFocusOrThrow>>) => {
  const openTasks = focus.tasks.filter((task) => !task.completed);
  const completedTasks = focus.tasks.filter((task) => task.completed);
  const datedOpenTasks = openTasks.filter((task) => task.dueDate).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  const taskLines = openTasks.length
    ? openTasks
        .slice(0, 8)
        .map((task, index) => `${index + 1}. ${task.title}${task.dueDate ? ` · due ${task.dueDate}` : ''}${task.description ? ` · ${clip(task.description, 120)}` : ''}`)
        .join('\n')
    : 'No open tasks yet.';

  const completedLines = completedTasks.length
    ? completedTasks
        .slice(0, 5)
        .map((task, index) => `${index + 1}. ${task.title}${task.dueDate ? ` · completed with due date ${task.dueDate}` : ''}`)
        .join('\n')
    : 'No completed tasks yet.';

  const memberLines = [focus.owner, ...focus.members]
    .map((member, index) => `${index + 1}. ${member.name} (${member.phone})${member.id === focus.owner.id ? ' · owner' : ''}`)
    .join('\n');

  return `
FOCUS TITLE: ${focus.title}
FOCUS DESCRIPTION: ${focus.description}
ACCESS ROLE OF CURRENT USER: ${focus.accessRole}
OWNER: ${focus.owner.name} (${focus.owner.phone})
TEAM MEMBERS COUNT: ${focus.collaboratorCount + 1}
TEAM:
${memberLines}

TASK STATS:
- Total tasks: ${focus.tasks.length}
- Open tasks: ${openTasks.length}
- Completed tasks: ${completedTasks.length}
- Nearest due task: ${datedOpenTasks[0] ? `${datedOpenTasks[0].title} (${datedOpenTasks[0].dueDate})` : 'none'}

OPEN TASKS:
${taskLines}

RECENT COMPLETED TASKS:
${completedLines}
`;
};

const buildSystemPrompt = (focus: Awaited<ReturnType<typeof getFocusOrThrow>>) => `You are Assistant Grows AI — a premium business co-pilot inside one focus workspace.

Your job is not to chat vaguely. You help the user turn a business idea into concrete progress.

Rules:
- Reply in Russian unless the user writes in another language.
- Be specific, direct, practical, and structured.
- Use the focus context and tasks below as ground truth.
- When helpful, break your answer into: goal, diagnosis, next steps, risks, and what to do today.
- If the user asks something broad, narrow it to concrete business actions.
- If the user asks for a strategy, provide a realistic sequence, not motivation.
- If there is not enough information, say what is missing and ask 1-3 sharp follow-up questions.
- Keep answers concise but useful.
- Avoid generic filler and avoid pretending that unknown facts are known.

Current workspace context:
${buildFocusContext(focus)}`;

const fetchCompletion = async (messages: Array<{ role: 'user' | 'assistant'; content: string }>, focus: Awaited<ReturnType<typeof getFocusOrThrow>>) => {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('OPENAI_API_KEY is not configured on the server.', 503);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: 800,
      messages: [
        { role: 'system', content: buildSystemPrompt(focus) },
        ...messages
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI request failed.';
    throw new AppError(message, response.status);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new AppError('AI returned an empty response.', 502);
  }

  return content.trim();
};

export const listFocusChatMessages = async (userId: string, focusId: string) => {
  await getFocusOrThrow(userId, focusId);

  const messages = await prisma.focusChatMessage.findMany({
    where: { focusId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    author: message.user
      ? {
          id: message.user.id,
          name: message.user.name,
          phone: message.user.phone
        }
      : null
  }));
};

export const sendFocusChatMessage = async (userId: string, focusId: string, content: string) => {
  const focus = await getFocusOrThrow(userId, focusId);
  const trimmed = content.trim();

  const userMessage = await prisma.focusChatMessage.create({
    data: {
      focusId,
      userId,
      role: 'user',
      content: trimmed
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  const recentMessages = await prisma.focusChatMessage.findMany({
    where: { focusId },
    orderBy: { createdAt: 'desc' },
    take: MAX_HISTORY_MESSAGES
  });

  const history = recentMessages
    .reverse()
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

  const assistantContent = await fetchCompletion(history, focus);

  const assistantMessage = await prisma.focusChatMessage.create({
    data: {
      focusId,
      role: 'assistant',
      content: assistantContent
    }
  });

  return {
    userMessage: {
      id: userMessage.id,
      role: userMessage.role,
      content: userMessage.content,
      createdAt: userMessage.createdAt,
      author: userMessage.user
        ? {
            id: userMessage.user.id,
            name: userMessage.user.name,
            phone: userMessage.user.phone
          }
        : null
    },
    assistantMessage: {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
      author: null
    }
  };
};
