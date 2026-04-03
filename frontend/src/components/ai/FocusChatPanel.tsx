import { useEffect, useMemo, useRef, useState } from 'react';
import { aiApi } from '../../api/ai';
import type { Focus, FocusChatMessage } from '../../types/api';

type FocusChatPanelProps = {
  focus: Focus;
  token: string;
  active: boolean;
};

const SUGGESTIONS = [
  'Собери мне MVP-план на 7 дней для этого Focus',
  'Разложи текущие задачи по приоритету и рискам',
  'Скажи, что тормозит запуск сильнее всего',
  'Сделай мне план продаж или первых клиентов'
];

export const FocusChatPanel = ({ focus, token, active }: FocusChatPanelProps) => {
  const [messages, setMessages] = useState<FocusChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const welcomeContent = useMemo(
    () => `Я уже в контексте Focus «${focus.title}». Могу помочь со стратегией, MVP, продажами, упаковкой, декомпозицией задач и следующим лучшим шагом.`,
    [focus.title]
  );

  const loadMessages = async () => {
    setIsBootstrapping(true);
    setError(null);
    try {
      const nextMessages = await aiApi.listMessages(focus.id, token);
      setMessages(nextMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить чат.');
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    if (!active) return;
    void loadMessages();
  }, [active, focus.id, token]);

  useEffect(() => {
    if (!active || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, active, isLoading]);

  const submitMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    const optimisticUserMessage: FocusChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
      author: null
    };
    const optimisticAssistantMessage: FocusChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: 'Думаю над ответом…',
      createdAt: new Date().toISOString(),
      author: null
    };

    setMessages((prev) => [...prev, optimisticUserMessage, optimisticAssistantMessage]);
    setInput('');

    try {
      const response = await aiApi.sendMessage(focus.id, { content: trimmed }, token);
      setMessages((prev) => [
        ...prev.filter((message) => !message.id.startsWith('temp-')),
        response.userMessage,
        response.assistantMessage
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((message) => !message.id.startsWith('temp-')));
      setError(err instanceof Error ? err.message : 'Не удалось получить ответ ассистента.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="ai-chat-shell tab-panel-shell">
      <div className="ai-chat-main-card">
        <div className="ai-chat-head">
          <div>
            <h3>AI Бизнес-Наставник</h3>
            <p>Реальный ассистент внутри Focus: видит контекст проекта, задачи, дедлайны и команду.</p>
          </div>
          <span className="focus-chip emphasis">{focus.tasks.length} задач в контексте</span>
        </div>

        <div className="ai-chat-context-strip">
          <span className="focus-chip emphasis soft">Стратегия</span>
          <span className="focus-chip emphasis soft">MVP</span>
          <span className="focus-chip emphasis soft">Продажи</span>
          <span className="focus-chip emphasis soft">Next steps</span>
        </div>

        <div className="ai-chat-suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" className="filter-button" onClick={() => void submitMessage(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>

        {error ? <div className="notice notice-error">{error}</div> : null}

        <div className="ai-chat-thread" ref={scrollRef}>
          {!messages.length && !isBootstrapping ? (
            <article className="ai-message ai-message-assistant">
              <div className="ai-message-avatar ai-message-avatar-assistant">AI</div>
              <div className="ai-message-bubble ai-message-bubble-assistant">
                <p>{welcomeContent}</p>
              </div>
            </article>
          ) : null}

          {isBootstrapping ? <div className="subtle-empty-card">Загружаем историю общения…</div> : null}

          {messages.map((message) => (
            <article key={message.id} className={`ai-message ${message.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}>
              <div className={`ai-message-avatar ${message.role === 'user' ? 'ai-message-avatar-user' : 'ai-message-avatar-assistant'}`}>
                {message.role === 'user' ? 'Вы' : 'AI'}
              </div>
              <div className={`ai-message-bubble ${message.role === 'user' ? 'ai-message-bubble-user' : 'ai-message-bubble-assistant'}`}>
                <p>{message.content}</p>
                <span>{new Date(message.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
              </div>
            </article>
          ))}
        </div>

        <form
          className="ai-chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage(input);
          }}
        >
          <textarea
            className="text-area ai-chat-input"
            placeholder="Напишите, что нужно: стратегия, MVP, продажи, приоритеты, план на неделю…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
          />
          <div className="ai-chat-composer-footer">
            <p>Ассистент отвечает в контексте текущего Focus и истории вашего чата.</p>
            <button className="button button-primary button-large" type="submit" disabled={isLoading || input.trim().length < 2}>
              {isLoading ? 'Думает…' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
