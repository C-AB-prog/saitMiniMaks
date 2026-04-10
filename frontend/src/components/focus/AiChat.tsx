import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { aiApi, type AiMessage } from '../../api/ai';
import { IconBrain, IconSend, IconTrash } from '../ui/Icons';

const STARTER_PROMPTS = [
  'Собери для меня план запуска бизнеса с нуля на 14 дней',
  'Разбери мой Focus как бизнес-наставник: где узкое место и что делать первым',
  'Сформулируй сильный оффер и для кого он реально нужен',
  'Дай 3 реалистичные гипотезы роста и как быстро их проверить',
  'Помоги выбрать MVP: что делать, а что пока вырезать',
  'Почему могут не идти продажи и какие проверки сделать уже сегодня',
];

const MESSAGE_LIMIT = 4000;

type Props = {
  focusId: string;
  token: string;
  isOwner: boolean;
};

const formatInline = (text: string) => {
  const chunks = text.split(/(\*\*[^*]+\*\*)/g);

  return chunks.map((chunk, index) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={`${chunk}-${index}`}>{chunk.slice(2, -2)}</strong>;
    }

    return <Fragment key={`${chunk}-${index}`}>{chunk}</Fragment>;
  });
};

export const AiChat = ({ focusId, token, isOwner }: Props) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    setMessages([]);
    setError(null);

    aiApi
      .getHistory(focusId, token)
      .then((msgs) => {
        setMessages(msgs);
        setTimeout(() => scrollToBottom('auto'), 50);
      })
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setInitialLoading(false));
  }, [focusId, token, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const optimisticUser: AiMessage = {
        id: `tmp-user-${Date.now()}`,
        focusId,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUser]);
      setInput('');
      setSending(true);
      setError(null);
      resetTextareaHeight();

      try {
        const reply = await aiApi.sendMessage(focusId, trimmed, token);
        const assistantMsg: AiMessage = {
          id: `tmp-ai-${Date.now()}`,
          focusId,
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (nextError: unknown) {
        setError(nextError instanceof Error ? nextError.message : 'Ошибка при отправке. Попробуйте ещё раз.');
        setMessages((prev) => prev.filter((message) => message.id !== optimisticUser.id));
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    },
    [focusId, token, sending]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value.slice(0, MESSAGE_LIMIT);
    setInput(nextValue);

    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleClearHistory = async () => {
    if (!isOwner || clearing) return;

    setClearing(true);

    try {
      await aiApi.clearHistory(focusId, token);
      setMessages([]);
      setError(null);
    } catch (nextError: unknown) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось очистить историю.');
    } finally {
      setClearing(false);
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = (key: string) => {
      if (!listBuffer.length || !listType) return;

      const items = listBuffer.map((item, index) => <li key={`${key}-${index}`}>{formatInline(item)}</li>);

      blocks.push(
        listType === 'ol' ? (
          <ol key={key} className="ai-msg-list ai-msg-list--ordered">{items}</ol>
        ) : (
          <ul key={key} className="ai-msg-list">{items}</ul>
        )
      );

      listBuffer = [];
      listType = null;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const bulletMatch = /^[-•*]\s+(.+)$/.exec(trimmed);
      const orderedMatch = /^\d+[.)]\s+(.+)$/.exec(trimmed);

      if (bulletMatch) {
        if (listType !== 'ul') {
          flushList(`list-switch-${index}`);
          listType = 'ul';
        }
        listBuffer.push(bulletMatch[1]);
        return;
      }

      if (orderedMatch) {
        if (listType !== 'ol') {
          flushList(`list-switch-${index}`);
          listType = 'ol';
        }
        listBuffer.push(orderedMatch[1]);
        return;
      }

      flushList(`list-${index}`);

      if (!trimmed) {
        blocks.push(<div key={`space-${index}`} className="ai-msg-spacer" />);
        return;
      }

      blocks.push(
        <p key={`p-${index}`} className="ai-msg-paragraph">
          {formatInline(trimmed)}
        </p>
      );
    });

    flushList('list-final');

    return blocks;
  };

  if (initialLoading) {
    return (
      <section className="ai-chat-shell">
        <div className="ai-chat-loading-state">
          <div className="ai-typing-indicator">
            <span /><span /><span />
          </div>
          <p className="muted-text" style={{ marginTop: '14px', fontSize: '0.85rem' }}>
            Загружаем историю чата...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ai-chat-shell">
      <div className="ai-chat-header">
        <div className="ai-chat-header-identity">
          <div className="ai-avatar-ring">
            <IconBrain size={15} />
          </div>
          <div className="ai-chat-header-copy">
            <strong className="ai-chat-title">AI Бизнес-Наставник</strong>
            <span className="ai-chat-subtitle">Стратегия, оффер, запуск, продажи и рост — с учётом вашего Focus</span>
          </div>
        </div>
        {isOwner && messages.length > 0 && (
          <button
            className="ai-clear-btn"
            type="button"
            onClick={() => void handleClearHistory()}
            disabled={clearing}
            title="Очистить историю чата"
          >
            <IconTrash size={13} />
            {clearing ? 'Очищаем...' : 'Очистить'}
          </button>
        )}
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">
              <IconBrain size={32} />
            </div>
            <h3 className="ai-empty-title">Готов помочь как реальный бизнес-наставник</h3>
            <p className="ai-empty-desc muted-text">
              Можно разложить запуск с нуля, выбрать MVP, оффер, канал продаж или найти узкое место в уже существующем проекте.
            </p>

            {error ? <div className="notice notice-error ai-inline-error">{error}</div> : null}

            <div className="ai-starters-grid">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="ai-starter-chip"
                  type="button"
                  onClick={() => void send(prompt)}
                  disabled={sending}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg-row ai-msg-row--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-msg-avatar">
                    <IconBrain size={13} />
                  </div>
                )}
                <div className={`ai-msg-bubble ai-msg-bubble--${msg.role}`}>
                  <div className="ai-msg-body">{renderContent(msg.content)}</div>
                  <time className="ai-msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </div>
            ))}

            {sending && (
              <div className="ai-msg-row ai-msg-row--assistant">
                <div className="ai-msg-avatar">
                  <IconBrain size={13} />
                </div>
                <div className="ai-msg-bubble ai-msg-bubble--assistant ai-msg-bubble--loading">
                  <div className="ai-typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="notice notice-error ai-inline-error">
                {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-chat-input-area">
        <div className="ai-input-wrapper">
          <textarea
            ref={textareaRef}
            className="ai-textarea"
            placeholder="Напишите вопрос по запуску, офферу, продажам, MVP или росту..."
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
            maxLength={MESSAGE_LIMIT}
          />
          <button
            className="ai-send-button"
            type="button"
            disabled={!input.trim() || sending}
            onClick={() => void send(input)}
            title="Отправить"
          >
            <IconSend size={15} />
          </button>
        </div>
        <div className="ai-input-footer">
          <p className="ai-input-hint">
            Enter — отправить · Shift+Enter — новая строка · AI учитывает контекст Focus
          </p>
          <span className="ai-char-count">{input.length}/{MESSAGE_LIMIT}</span>
        </div>
      </div>
    </section>
  );
};
