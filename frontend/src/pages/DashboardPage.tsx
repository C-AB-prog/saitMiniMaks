import { useEffect, useMemo, useState } from 'react';
import { focusApi } from '../api/focuses';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { FocusSummary } from '../types/api';
import { FocusCard } from '../components/focus/FocusCard';
import { FocusFormModal } from '../components/focus/FocusFormModal';
import { EmptyState } from '../components/ui/EmptyState';
import { IconPlus, IconUsers, IconCheckCircle, IconActivity, IconGrid, IconTrendUp } from '../components/ui/Icons';

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

  useEffect(() => { void loadFocuses(); }, [token]);

  const totals = useMemo(() => {
    return focuses.reduce(
      (acc, focus) => {
        acc.focusCount += 1;
        acc.completed += focus.completedTaskCount;
        acc.open += Math.max(0, focus.taskCount - focus.completedTaskCount);
        acc.shared += focus.accessRole === 'member' ? 1 : 0;
        acc.collaborators += focus.collaboratorCount;
        return acc;
      },
      { focusCount: 0, completed: 0, open: 0, shared: 0, collaborators: 0 }
    );
  }, [focuses]);

  const ownedFocuses = focuses.filter((f) => f.accessRole === 'owner');
  const sharedFocuses = focuses.filter((f) => f.accessRole === 'member');

  const stats = [
    { icon: <IconGrid size={14} />, label: 'Всего Focus', value: totals.focusCount },
    { icon: <IconActivity size={14} />, label: 'Открытых задач', value: totals.open },
    { icon: <IconCheckCircle size={14} />, label: 'Выполнено', value: totals.completed },
    { icon: <IconUsers size={14} />, label: 'Shared', value: totals.shared },
    { icon: <IconTrendUp size={14} />, label: 'Участников', value: totals.collaborators },
  ];

  return (
    <div className="page-stack dashboard-page-stack dashboard-page-polished">

      {/* ── Hero ── */}
      <section
        className="dashboard-hero-panel dashboard-hero-closer dashboard-hero-deep animate-fade-up"
        style={{ animationDelay: '0s' }}
      >
        <div className="hero-kicker">Premium productivity workspace</div>
        <h1>
          Ваши Focus
          <small>{user ? `${user.name} · ${user.phone}` : 'Рабочая система для ваших проектов'}</small>
        </h1>
        <p>
          Создавайте отдельные пространства, ведите задачи, подключайте людей по номеру телефона и держите весь проект в одном премиальном контексте.
        </p>
        <div className="hero-actions center-actions">
          <button
            className="button button-primary button-large create-focus-main-button"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            style={{ gap: '8px' }}
          >
            <IconPlus size={18} />
            Создать новый Focus
          </button>
        </div>
      </section>

      <section className="dashboard-section-stack dashboard-section-polished">
        <div
          className="section-row section-row-heading-only section-row-spacious animate-fade-up"
          style={{ animationDelay: '.08s' }}
        >
          <div>
            <span className="section-kicker">Рабочие пространства</span>
            <h2 className="section-title-large">Ваши активные Focus</h2>
          </div>
          <button
            className="button button-secondary button-small"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            style={{ gap: '6px' }}
          >
            <IconPlus size={12} />
            Новый Focus
          </button>
        </div>

        {error ? <div className="notice notice-error">{error}</div> : null}

        {isLoading ? (
          <div className="loading-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <div className="ai-typing-indicator" style={{ display: 'flex', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-vivid)', display: 'inline-block', animation: 'aiDotPulse 1.3s ease-in-out infinite' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-vivid)', display: 'inline-block', animation: 'aiDotPulse 1.3s ease-in-out infinite .18s' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-vivid)', display: 'inline-block', animation: 'aiDotPulse 1.3s ease-in-out infinite .36s' }} />
              </div>
              Загружаем Focus...
            </div>
          </div>
        ) : null}

        {!isLoading && !focuses.length ? (
          <EmptyState
            title="Пока нет ни одного Focus"
            description="Нажмите «Создать новый Focus» и соберите первое рабочее пространство."
          />
        ) : null}

        {ownedFocuses.length ? (
          <div
            className="page-stack section-card-shell animate-fade-up"
            style={{ animationDelay: '.12s' }}
          >
            <div className="section-mini-head section-mini-head-polished">
              <div>
                <h3>Мои Focus</h3>
                <p>Проекты, где вы владелец и можете редактировать состав участников.</p>
              </div>
              <span className="focus-chip emphasis">
                <IconGrid size={11} />
                {ownedFocuses.length}
              </span>
            </div>
            <div className="focus-grid-layout focus-grid-dashboard">
              {ownedFocuses.map((focus, i) => (
                <div
                  key={focus.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${.16 + i * .06}s` }}
                >
                  <FocusCard focus={focus} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {sharedFocuses.length ? (
          <div
            className="page-stack section-card-shell animate-fade-up"
            style={{ animationDelay: '.2s' }}
          >
            <div className="section-mini-head section-mini-head-polished">
              <div>
                <h3>Shared with me</h3>
                <p>Focus, в которые вас добавили другие участники команды.</p>
              </div>
              <span className="focus-chip emphasis soft">
                <IconUsers size={11} />
                {sharedFocuses.length}
              </span>
            </div>
            <div className="focus-grid-layout focus-grid-dashboard">
              {sharedFocuses.map((focus, i) => (
                <div
                  key={focus.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${.24 + i * .06}s` }}
                >
                  <FocusCard focus={focus} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Stats strip ── */}
        <div
          className="dashboard-bottom-stats-grid dashboard-bottom-stats-grid-rich animate-fade-up"
          style={{ animationDelay: '.28s' }}
        >
          {stats.map(({ icon, label, value }) => (
            <article className="dashboard-bottom-stat-card" key={label}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {icon}
                {label}
              </span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <FocusFormModal
        open={isCreateOpen}
        mode="create"
        onClose={() => { setError(null); setIsCreateOpen(false); }}
        onSubmit={async (payload) => {
          if (!token) return;
          await wrap(() => focusApi.create(payload, token));
          await loadFocuses();
        }}
      />
    </div>
  );
};
