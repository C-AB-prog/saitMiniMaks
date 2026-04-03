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
        acc.shared += focus.accessRole === 'member' ? 1 : 0;
        acc.collaborators += focus.collaboratorCount;
        return acc;
      },
      { focusCount: 0, completed: 0, open: 0, shared: 0, collaborators: 0 }
    );
  }, [focuses]);

  const ownedFocuses = focuses.filter((focus) => focus.accessRole === 'owner');
  const sharedFocuses = focuses.filter((focus) => focus.accessRole === 'member');

  return (
    <div className="page-stack dashboard-page-stack dashboard-page-polished">
      <section className="dashboard-hero-panel dashboard-hero-closer dashboard-hero-deep">
        <div className="hero-kicker">Premium productivity workspace</div>
        <h1>
          Ваши Focus
          <small>{user ? `${user.name} · ${user.phone}` : 'Рабочая система для ваших проектов'}</small>
        </h1>
        <p>Создавайте отдельные пространства, ведите задачи, подключайте людей по номеру телефона и держите весь проект в одном премиальном контексте.</p>
        <div className="hero-actions center-actions">
          <button className="button button-primary button-large create-focus-main-button" type="button" onClick={() => setIsCreateOpen(true)}>
            Создать новый Focus
          </button>
        </div>
      </section>

      <section className="dashboard-section-stack dashboard-section-polished">
        <div className="section-row section-row-heading-only section-row-spacious">
          <div>
            <span className="section-kicker">Рабочие пространства</span>
            <h2 className="section-title-large">Ваши активные Focus</h2>
          </div>
        </div>

        {error ? <div className="notice notice-error">{error}</div> : null}
        {isLoading ? <div className="loading-card">Загружаем Focus...</div> : null}

        {!isLoading && !focuses.length ? (
          <EmptyState
            title="Пока нет ни одного Focus"
            description="Нажмите «Создать новый Focus» и соберите первое рабочее пространство."
          />
        ) : null}

        {ownedFocuses.length ? (
          <div className="page-stack section-card-shell">
            <div className="section-mini-head">
              <div>
                <h3>Мои Focus</h3>
                <p>Проекты, где вы владелец и можете редактировать состав участников.</p>
              </div>
              <span className="focus-chip emphasis">{ownedFocuses.length}</span>
            </div>
            <div className="focus-grid-layout focus-grid-dashboard">
              {ownedFocuses.map((focus) => (
                <FocusCard key={focus.id} focus={focus} />
              ))}
            </div>
          </div>
        ) : null}

        {sharedFocuses.length ? (
          <div className="page-stack section-card-shell">
            <div className="section-mini-head">
              <div>
                <h3>Shared with me</h3>
                <p>Focus, в которые вас добавили другие участники команды.</p>
              </div>
              <span className="focus-chip emphasis soft">{sharedFocuses.length}</span>
            </div>
            <div className="focus-grid-layout focus-grid-dashboard">
              {sharedFocuses.map((focus) => (
                <FocusCard key={focus.id} focus={focus} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="dashboard-bottom-stats-grid dashboard-bottom-stats-grid-rich">
          <article className="dashboard-bottom-stat-card">
            <span>Всего Focus</span>
            <strong>{totals.focusCount}</strong>
          </article>
          <article className="dashboard-bottom-stat-card">
            <span>Открытых задач</span>
            <strong>{totals.open}</strong>
          </article>
          <article className="dashboard-bottom-stat-card">
            <span>Выполнено задач</span>
            <strong>{totals.completed}</strong>
          </article>
          <article className="dashboard-bottom-stat-card">
            <span>Shared Focus</span>
            <strong>{totals.shared}</strong>
          </article>
          <article className="dashboard-bottom-stat-card">
            <span>Подключено людей</span>
            <strong>{totals.collaborators}</strong>
          </article>
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
