import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { focusApi } from '../api/focuses';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { FocusSummary } from '../types/api';
import { FocusCard } from '../components/focus/FocusCard';

export const ProfilePage = () => {
  const { user, token, logout } = useAuth();
  const { isLoading, error, wrap } = useAsyncState();
  const [focuses, setFocuses] = useState<FocusSummary[]>([]);

  useEffect(() => {
    if (!token) return;
    void wrap(() => focusApi.list(token)).then((response) => setFocuses(response ?? []));
  }, [token]);

  const stats = useMemo(() => {
    return focuses.reduce(
      (acc, focus) => {
        acc.focusCount += 1;
        acc.completed += focus.completedTaskCount;
        acc.open += Math.max(0, focus.taskCount - focus.completedTaskCount);
        if (focus.accessRole === 'member') acc.shared += 1;
        if (focus.accessRole === 'owner') acc.owned += 1;
        acc.collaborators += focus.collaboratorCount;
        return acc;
      },
      { focusCount: 0, completed: 0, open: 0, shared: 0, owned: 0, collaborators: 0 }
    );
  }, [focuses]);

  const spotlight = useMemo(() => {
    return focuses
      .slice()
      .sort((a, b) => b.taskCount - b.completedTaskCount - (a.taskCount - a.completedTaskCount))
      .slice(0, 3);
  }, [focuses]);

  if (!user) return null;

  return (
    <div className="page-stack profile-page-shell">
      <section className="profile-page-hero section-card-shell profile-page-hero-shell">
        <div className="profile-page-hero-main">
          <div className="profile-page-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="profile-page-copy">
            <span className="section-kicker">Личный кабинет</span>
            <h1>{user.name}</h1>
            <p>{user.phone}</p>
            <div className="inline-chip-row profile-page-chip-row">
              <span className="focus-chip emphasis">{user.role === 'ADMIN' ? 'Администратор' : 'Рабочий аккаунт'}</span>
              <span className="focus-chip emphasis soft">{stats.owned} owner Focus</span>
              <span className="focus-chip emphasis soft">{stats.shared} shared</span>
            </div>
          </div>
        </div>
        <div className="profile-page-hero-actions">
          <Link to="/app" className="button button-secondary">К dashboard</Link>
          <button className="button button-primary" type="button" onClick={logout}>Выйти</button>
        </div>
      </section>

      <section className="profile-page-stats-grid">
        <article className="profile-stat-card"><span className="stat-card-label">Всего Focus</span><strong>{stats.focusCount}</strong></article>
        <article className="profile-stat-card"><span className="stat-card-label">Открытых задач</span><strong>{stats.open}</strong></article>
        <article className="profile-stat-card"><span className="stat-card-label">Выполнено</span><strong>{stats.completed}</strong></article>
        <article className="profile-stat-card"><span className="stat-card-label">Людей в Focus</span><strong>{stats.collaborators}</strong></article>
      </section>

      <div className="profile-page-grid">
        <section className="section-card-shell profile-page-card">
          <div className="section-mini-head profile-head-row">
            <div>
              <h3>Данные аккаунта</h3>
              <p>Чистый отдельный экран без модального скролла и перекосов по высоте.</p>
            </div>
          </div>
          <div className="profile-detail-list">
            <div className="profile-detail-row"><span>Регистрация</span><strong>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</strong></div>
            <div className="profile-detail-row"><span>Телефон для приглашений</span><strong>{user.phone}</strong></div>
            <div className="profile-detail-row"><span>Статус аккаунта</span><strong>Активен</strong></div>
            <div className="profile-detail-row"><span>Тип доступа</span><strong>{user.role === 'ADMIN' ? 'Полный доступ' : 'Рабочий аккаунт'}</strong></div>
          </div>
        </section>

        <section className="section-card-shell profile-page-card">
          <div className="section-mini-head profile-head-row">
            <div>
              <h3>Focus spotlight</h3>
              <p>Самые активные пространства по текущему объёму незавершённых задач.</p>
            </div>
          </div>
          <div className="profile-spotlight-list">
            {spotlight.length ? (
              spotlight.map((focus) => (
                <div key={focus.id} className="profile-spotlight-row profile-spotlight-row-candy">
                  <div>
                    <strong>{focus.title}</strong>
                    <span>{focus.accessRole === 'owner' ? 'Вы владелец' : `Shared by ${focus.owner.name}`}</span>
                  </div>
                  <b>{Math.max(0, focus.taskCount - focus.completedTaskCount)}</b>
                </div>
              ))
            ) : (
              <div className="subtle-empty-card">Как только появятся Focus, здесь будет быстрый срез по самым активным проектам.</div>
            )}
          </div>
        </section>
      </div>

      {error ? <div className="notice notice-error">{error}</div> : null}
      {isLoading ? <div className="loading-card">Загружаем профиль...</div> : null}

      {focuses.length ? (
        <section className="section-card-shell profile-focus-list-shell">
          <div className="section-mini-head">
            <div>
              <h3>Ваши пространства</h3>
              <p>Быстрый доступ ко всем Focus прямо со страницы профиля.</p>
            </div>
          </div>
          <div className="focus-grid-layout focus-grid-dashboard">
            {focuses.map((focus) => (
              <FocusCard key={focus.id} focus={focus} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
