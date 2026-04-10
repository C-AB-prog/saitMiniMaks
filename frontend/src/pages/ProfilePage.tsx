import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { focusApi } from '../api/focuses';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { FocusSummary } from '../types/api';
import { FocusCard } from '../components/focus/FocusCard';
import {
  IconGrid,
  IconActivity,
  IconCheckCircle,
  IconUsers,
  IconHome,
  IconLogOut,
  IconUser,
  IconPhone,
  IconSettings,
  IconStar,
} from '../components/ui/Icons';

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
      .sort((a, b) => (b.taskCount - b.completedTaskCount) - (a.taskCount - a.completedTaskCount))
      .slice(0, 3);
  }, [focuses]);

  if (!user) return null;

  return (
    <div className="page-stack profile-page-shell">
      <section className="section-card-shell profile-page-hero profile-page-hero-shell">
        <div className="profile-page-hero-main">
          <div className="profile-page-avatar">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-page-copy">
            <span className="section-kicker">Личный кабинет</span>
            <h1>{user.name}</h1>
            <p>{user.phone}</p>
            <div className="inline-chip-row profile-page-chip-row">
              <span className="focus-chip emphasis">
                <IconSettings size={11} />
                {user.role === 'ADMIN' ? 'Администратор' : 'Рабочий аккаунт'}
              </span>
              <span className="focus-chip emphasis soft">
                <IconGrid size={11} />
                {stats.owned} owner Focus
              </span>
              <span className="focus-chip emphasis soft">
                <IconUsers size={11} />
                {stats.shared} shared
              </span>
            </div>
          </div>
        </div>
        <div className="profile-page-hero-actions">
          <Link to="/app" className="button button-secondary" style={{ gap: '6px' }}>
            <IconHome size={14} />
            К dashboard
          </Link>
          <button className="button button-primary" type="button" onClick={logout} style={{ gap: '6px' }}>
            <IconLogOut size={14} />
            Выйти
          </button>
        </div>
      </section>

      <section className="profile-page-stats-grid">
        {[
          { icon: <IconGrid size={16} />, label: 'Всего Focus', value: stats.focusCount },
          { icon: <IconActivity size={16} />, label: 'Открытых задач', value: stats.open },
          { icon: <IconCheckCircle size={16} />, label: 'Выполнено', value: stats.completed },
          { icon: <IconUsers size={16} />, label: 'Людей в Focus', value: stats.collaborators },
        ].map(({ icon, label, value }) => (
          <article className="profile-stat-card" key={label}>
            <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {icon}
              {label}
            </span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <div className="profile-page-grid">
        <section className="section-card-shell profile-page-card">
          <div className="section-mini-head profile-head-row" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Данные аккаунта</h3>
              <p>Информация о вашём профиле и статусе доступа.</p>
            </div>
          </div>
          <div className="profile-detail-list">
            {[
              { icon: <IconUser size={13} />, label: 'Регистрация', value: new Date(user.createdAt).toLocaleDateString('ru-RU') },
              { icon: <IconPhone size={13} />, label: 'Телефон для приглашений', value: user.phone },
              { icon: <IconCheckCircle size={13} />, label: 'Статус аккаунта', value: 'Активен' },
              { icon: <IconSettings size={13} />, label: 'Тип доступа', value: user.role === 'ADMIN' ? 'Полный доступ' : 'Рабочий аккаунт' },
            ].map(({ icon, label, value }) => (
              <div className="profile-detail-row" key={label}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {icon}
                  {label}
                </span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="section-card-shell profile-page-card">
          <div className="section-mini-head profile-head-row" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Focus spotlight</h3>
              <p>Самые активные пространства по объёму незавершённых задач.</p>
            </div>
            <IconStar size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
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
              <div className="subtle-empty-card">
                Как только появятся Focus, здесь будет быстрый срез по самым активным проектам.
              </div>
            )}
          </div>
        </section>
      </div>

      {error ? <div className="notice notice-error">{error}</div> : null}
      {isLoading ? <div className="loading-card">Загружаем профиль...</div> : null}

      {focuses.length ? (
        <section className="section-card-shell profile-focus-list-shell">
          <div className="section-mini-head" style={{ marginBottom: '16px' }}>
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
