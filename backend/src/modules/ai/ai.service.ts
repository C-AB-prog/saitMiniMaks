import OpenAI from 'openai';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

type FocusForContext = {
  title: string;
  description: string;
  user: { name: string };
  members: { user: { name: string } }[];
  tasks: { title: string; completed: boolean; dueDate?: string | null }[];
};

const looksLikeApiKey = (value?: string | null) => typeof value === 'string' && value.trim().startsWith('sk-');

const getOpenAIClient = (): OpenAI => {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'sk-your-openai-key-here') {
    throw new AppError(
      'AI chat is not configured yet. Add a real OPENAI_API_KEY to backend/.env.',
      503
    );
  }

  if (looksLikeApiKey(env.OPENAI_MODEL)) {
    throw new AppError(
      'OPENAI_MODEL is configured incorrectly. Put the API key into OPENAI_API_KEY and set OPENAI_MODEL to a model name like gpt-4o-mini.',
      503
    );
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL || undefined,
  });
};

const buildSystemPrompt = (focus: FocusForContext): string => {
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = focus.tasks.filter((task) => !task.completed);
  const doneTasks = focus.tasks.filter((task) => task.completed);
  const overdueTasks = openTasks
    .filter((task) => task.dueDate && task.dueDate < today)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 5);
  const upcomingTasks = openTasks
    .filter((task) => task.dueDate && task.dueDate >= today)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 7);

  const teamNames = [focus.user.name, ...focus.members.map((member) => member.user.name)]
    .filter(Boolean)
    .join(', ');

  const openTasksList = openTasks.map((task) => task.title).slice(0, 15).join('; ') || 'нет открытых задач';
  const doneTasksList = doneTasks.map((task) => task.title).slice(0, 8).join('; ') || 'нет завершённых задач';
  const overdueList = overdueTasks
    .map((task) => `"${task.title}" — дедлайн ${task.dueDate}`)
    .join('; ') || 'нет просроченных задач';
  const upcomingList = upcomingTasks
    .map((task) => `"${task.title}" — ${task.dueDate}`)
    .join('; ') || 'нет ближайших дедлайнов';

  return `You are an embedded business mentor inside a product called Focus.

ROLE
You are not a generic chatbot. You are a sharp business builder, operator, strategist, growth advisor, offer architect, and execution partner.
You help users:
- build a business from zero,
- choose a market and target customer,
- shape an offer,
- launch an MVP,
- get first customers,
- improve sales, positioning, funnels, retention, and operations,
- diagnose why an existing business is stuck.

CURRENT FOCUS CONTEXT
- Focus name: "${focus.title}"
- Description: "${focus.description}"
- Owner: ${focus.user.name}
- Team: ${teamNames || focus.user.name}
- Open tasks (${openTasks.length}): ${openTasksList}
- Completed tasks (${doneTasks.length}): ${doneTasksList}
- Overdue tasks: ${overdueList}
- Upcoming deadlines: ${upcomingList}

HOW TO THINK
1. First identify the business reality, bottleneck, or missing piece.
2. Prioritize leverage, not busywork.
3. Prefer decisions, tradeoffs, and concrete next moves over abstract theory.
4. Use the Focus context when it helps.
5. If the user asks for a plan, strategy, offer, funnel, script, positioning, or roadmap — produce the thing fully, not partially.
6. If details are missing, make the most reasonable assumptions, state them briefly, and move forward.
7. Ask at most one clarifying question only when the answer would materially change the recommendation. Otherwise proceed.
8. Always push toward action, validation, and speed.

HOW TO RESPOND
- Reply in the same language as the user.
- Be direct, practical, and specific.
- Do not use filler praise.
- Avoid generic motivational fluff.
- Use compact sections when useful.
- Mention numbers, experiments, channels, offers, pricing logic, positioning angles, or metrics whenever relevant.
- When diagnosing, separate symptom, probable root cause, and fix.
- When building from scratch, usually cover: customer, painful problem, promise, offer, MVP, acquisition, sales, and first 7-14 days.
- When improving an existing business, usually cover: bottleneck, hypothesis, what to test, what to stop, and what metric to watch.
- End with a clear next action for today.

DEFAULT RESPONSE SHAPE
Use this when it fits:
1. Короткий диагноз / суть
2. Главный приоритет
3. Конкретные шаги
4. Что измерять / какой сигнал успеха
5. Что сделать сегодня

IMPORTANT
Be decisive. The user should feel they are getting advice from a strong business mentor who can actually help launch and grow a business.`;
};

export const getChatHistory = async (focusId: string) => {
  return prisma.aiMessage.findMany({
    where: { focusId },
    orderBy: { createdAt: 'asc' },
  });
};

export const sendMessage = async (focusId: string, userContent: string): Promise<string> => {
  const client = getOpenAIClient();

  const focus = await prisma.focus.findUniqueOrThrow({
    where: { id: focusId },
    include: {
      user: { select: { name: true } },
      members: {
        include: { user: { select: { name: true } } },
      },
      tasks: {
        select: { title: true, completed: true, dueDate: true },
        orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
        take: 40,
      },
      aiMessages: {
        orderBy: { createdAt: 'asc' },
        take: 24,
      },
    },
  });

  const systemPrompt = buildSystemPrompt(focus);

  const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = focus.aiMessages.map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }));

  await prisma.aiMessage.create({
    data: { focusId, role: 'user', content: userContent },
  });

  try {
    const completion = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userContent },
      ],
      max_tokens: 1700,
      temperature: 0.55,
      presence_penalty: 0.15,
    });

    const assistantContent =
      completion.choices[0]?.message?.content?.trim() ??
      'Не удалось получить ответ от AI. Попробуйте ещё раз.';

    await prisma.aiMessage.create({
      data: { focusId, role: 'assistant', content: assistantContent },
    });

    return assistantContent;
  } catch (error: any) {
    const providerCode = error?.code ?? error?.error?.code;
    const providerMessage = error?.error?.message ?? error?.message ?? 'AI provider request failed.';

    if (providerCode === 'unsupported_country_region_territory' || error?.status === 403) {
      throw new AppError(
        'AI сейчас недоступен из текущей страны/региона для выбранного провайдера. Это не поломка сайта. Запусти backend на сервере в поддерживаемой стране или укажи совместимый AI-провайдер через OPENAI_BASE_URL.',
        503,
        {
          provider: 'openai-compatible',
          code: providerCode ?? 'forbidden',
          providerMessage,
        }
      );
    }

    if (providerCode === 'invalid_api_key' || error?.status === 401) {
      throw new AppError(
        'AI не отвечает из-за неверного API-ключа или доступа к модели. Проверь OPENAI_API_KEY и OPENAI_MODEL в backend/.env.',
        503,
        {
          provider: 'openai-compatible',
          code: providerCode ?? 'unauthorized',
          providerMessage,
        }
      );
    }

    throw new AppError(
      'Не удалось получить ответ от AI-провайдера. Проверь backend/.env и доступность провайдера.',
      503,
      {
        provider: 'openai-compatible',
        code: providerCode ?? 'provider_error',
        providerMessage,
      }
    );
  }
};

export const deleteChatHistory = async (focusId: string): Promise<void> => {
  await prisma.aiMessage.deleteMany({ where: { focusId } });
};
