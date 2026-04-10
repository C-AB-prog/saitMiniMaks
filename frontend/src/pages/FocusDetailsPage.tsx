import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { focusApi } from '../api/focuses';
import { fileUrl } from '../api/client';
import { FocusFormModal } from '../components/focus/FocusFormModal';
import { AiChat } from '../components/focus/AiChat';
import { CalendarSidebar } from '../components/task/CalendarSidebar';
import { TaskForm } from '../components/task/TaskForm';
import { TaskList } from '../components/task/TaskList';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { Focus, Task } from '../types/api';
import { formatDateLabel } from '../utils/date';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconUsers,
  IconCheckCircle,
  IconActivity,
  IconGrid,
  IconBrain,
  IconFolder,
  IconNote,
} from '../components/ui/Icons';

export const FocusDetailsPage = () => {
  const { focusId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, error, wrap } = useAsyncState();
  const [focus, setFocus] = useState<Focus | null>(null);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [isFocusEditOpen, setIsFocusEditOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isFocusDeleteOpen, setIsFocusDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'overview' | 'files' | 'notes'>('tasks');
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const lastScrollRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  const switchTab = (tab: 'tasks' | 'chat' | 'overview' | 'files' | 'notes') => {
    lastScrollRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    setActiveTab(tab);
  };

  const loadFocus = async () => {
    if (!token || !focusId) return;
    const response = await wrap(() => focusApi.get(focusId, token));
    setFocus(response);
  };

  useEffect(() => { void loadFocus(); }, [focusId, token]);

  useEffect(() => {
    if (!shouldRestoreScrollRef.current) return;
    const nextFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: lastScrollRef.current, behavior: 'auto' });
      shouldRestoreScrollRef.current = false;
    });
    return () => window.cancelAnimationFrame(nextFrame);
  }, [activeTab]);

  const filteredTasks = useMemo(() => {
    if (!focus) return [];
    return focus.tasks.filter((task) => {
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'incomplete' && task.completed) return false;
      if (selectedDate && task.dueDate !== selectedDate) return false;
      return true;
    });
  }, [focus, statusFilter, selectedDate]);

  const coverImage = fileUrl(focus?.coverImage);
  const completedCount = focus?.tasks.filter((t) => t.completed).length ?? 0;
  const progress = focus?.tasks.length ? Math.round((completedCount / focus.tasks.length) * 100) : 0;
  const activeCount = filteredTasks.filter((t) => !t.completed).length;
  const completeFilteredCount = filteredTasks.filter((t) => t.completed).length;
  const canManageFocus = focus?.accessRole === 'owner';

  if (isLoading && !focus) return <div className="loading-card">Загружаем Focus...</div>;
  if (!focus) return <div className="notice notice-error">{error ?? 'Focus не найден.'}</div>;

  const tabs: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'tasks',    label: 'Tasks',    icon: <IconGrid size={14} /> },
    { key: 'chat',     label: 'Chat',     icon: <IconBrain size={14} /> },
    { key: 'overview', label: 'Overview', icon: <IconActivity size={14} /> },
    { key: 'files',    label: 'Files',    icon: <IconFolder size={14} /> },
    { key: 'notes',    label: 'Notes',    icon: <IconNote size={14} /> },
  ];

  return (
    <div className="page-stack focus-page-stack focus-page-polished">
      <section className="focus-hero-shell focus-hero-shell-polished">
        <div
          className="focus-hero-cover focus-hero-cover-large"
          style={coverImage ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.82)), url(${coverImage})` } : undefined}
        />
        <div className="focus-hero-floating-card focus-hero-floating-card-polished">
          <div className="focus-hero-content focus-hero-content-tight focus-hero-content-polished">
            <div className="focus-hero-copy-block">
              <Link className="back-link" to="/app">
                <IconArrowLeft size={14} />
                Назад
              </Link>
              <div className="focus-copy-header-row focus-copy-header-row-polished">
                <div className="focus-heading-stack">
                  <div className="focus-title-status-row">
                    <h1>{focus.title}</h1>
                    <span className={`status-pill status-pill-rich ${focus.accessRole === 'member' ? 'status-pill-shared' : ''}`}>
                      {focus.accessRole === 'owner' ? 'Вы владелец' : `Shared by ${focus.owner.name}`}
                    </span>
                  </div>
                  <p>{focus.description}</p>
                </div>
                <div className="focus-hero-actions focus-hero-actions-polished focus-hero-actions-inline">
                  {canManageFocus ? (
                    <>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => setIsFocusEditOpen(true)}
                        style={{ gap: '6px' }}
                      >
                        <IconEdit size={13} />
                        Редактировать
                      </button>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => setIsFocusDeleteOpen(true)}
                        style={{ gap: '6px' }}
                      >
                        <IconTrash size={13} />
                        Удалить
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="inline-chip-row focus-summary-chips-row" style={{ marginTop: '12px' }}>
                <span className="focus-chip">{focus.tasks.length} задач</span>
                <span className="focus-chip">{completedCount} выполнено</span>
                <span className="focus-chip">{progress}% прогресс</span>
                <span className="focus-chip">
                  <IconUsers size={11} />
                  {focus.collaboratorCount + 1} участников
                </span>
              </div>
              <div className="member-stack-row" style={{ marginTop: '12px' }}>
                <div className="member-avatar owner" title={focus.owner.name}>
                  {focus.owner.name.slice(0, 1).toUpperCase()}
                </div>
                {focus.members.map((member) => (
                  <div key={member.id} className="member-avatar" title={`${member.name} · ${member.phone}`}>
                    {member.name.slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="focus-tabs-row focus-tabs-row-polished">
            {tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                className={`focus-tab-button ${activeTab === key ? 'active' : ''}`}
                onClick={() => switchTab(key)}
                style={{ gap: '6px' }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="notice notice-error">{error}</div> : null}

      {activeTab === 'tasks' ? (
        <div className="focus-layout-grid focus-layout-grid-closer focus-layout-grid-polished">
          <div className="page-stack page-stack-wide-gap">
            <TaskForm
              initialTask={taskBeingEdited}
              selectedDate={selectedDate}
              onCancelEdit={() => setTaskBeingEdited(null)}
              onSubmit={async (payload) => {
                if (!token || !focusId) return;
                if (taskBeingEdited) {
                  await wrap(() => focusApi.updateTask(taskBeingEdited.id, payload, token));
                  setTaskBeingEdited(null);
                } else {
                  await wrap(() => focusApi.createTask(focusId, payload, token));
                }
                await loadFocus();
              }}
            />

            <section className="page-stack section-card-shell task-main-shell">
              <div className="task-toolbar task-toolbar-candy">
                <div className="task-toolbar-main task-toolbar-main-fixed">
                  <h2 className="section-title-large">Задачи</h2>
                  <div className="filter-button-group filter-button-group-single-row" role="tablist" aria-label="Фильтр задач">
                    {[
                      { key: 'all', label: 'Все' },
                      { key: 'incomplete', label: 'Активные' },
                      { key: 'completed', label: 'Выполненные' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        className={`filter-button ${statusFilter === key ? 'active' : ''}`}
                        type="button"
                        onClick={() => setStatusFilter(key as typeof statusFilter)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="selected-day-panel selected-day-panel-rich selected-day-panel-polished">
                <div>
                  <strong>{selectedDate ? formatDateLabel(selectedDate) : 'Все даты'}</strong>
                  <p>
                    {selectedDate
                      ? `Открыто: ${activeCount} · Выполнено: ${completeFilteredCount}`
                      : 'Выберите день в календаре справа, чтобы посмотреть задачи конкретной даты.'}
                  </p>
                </div>
                <div className="selected-day-actions">
                  {selectedDate ? (
                    <>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => setSelectedDate(null)}
                      >
                        Показать все дни
                      </button>
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                        }}
                      >
                        Сегодня
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <TaskList
                tasks={filteredTasks}
                selectedDate={selectedDate}
                statusFilter={statusFilter}
                onToggle={async (taskId) => {
                  if (!token) return;
                  await wrap(() => focusApi.toggleTask(taskId, token));
                  await loadFocus();
                }}
                onEdit={(task) => setTaskBeingEdited(task)}
                onDelete={(task) => setTaskToDelete(task)}
              />
            </section>
          </div>

          <div className="page-stack page-stack-sidebar-gap focus-sidebar-stack">
            <CalendarSidebar
              month={calendarDate.month}
              year={calendarDate.year}
              selectedDate={selectedDate}
              tasks={focus.tasks}
              onChangeMonth={(delta) => {
                setCalendarDate((prev) => {
                  const next = new Date(prev.year, prev.month + delta, 1);
                  return { month: next.getMonth(), year: next.getFullYear() };
                });
              }}
              onSelectDate={setSelectedDate}
            />

            <section className="team-panel-card team-panel-card-polished">
              <div className="section-mini-head section-mini-head-polished">
                <div>
                  <h3>Команда Focus</h3>
                  <p>Добавляйте людей по номеру телефона.</p>
                </div>
                <span className="focus-chip emphasis">
                  <IconUsers size={11} />
                  {focus.collaboratorCount + 1}
                </span>
              </div>

              <div className="team-owner-highlight">
                <div className="member-avatar owner large">
                  {focus.owner.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{focus.owner.name}</strong>
                  <span>{focus.owner.phone} · владелец</span>
                </div>
              </div>

              <div className="team-member-list team-member-list-polished">
                {focus.members.length ? (
                  focus.members.map((member) => (
                    <article key={member.id} className="team-member-row team-member-row-polished">
                      <div className="member-avatar">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{member.name}</strong>
                        <span>{member.phone}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="subtle-empty-card">
                    Пока в Focus нет приглашённых участников.
                  </div>
                )}
              </div>

              {canManageFocus ? (
                <div className="team-note-card">
                  <strong>Управление командой</strong>
                  <p>Добавлять и удалять людей можно через кнопку «Редактировать» в шапке Focus.</p>
                </div>
              ) : (
                <div className="team-note-card">
                  <strong>Совместный доступ</strong>
                  <p>Вы видите этот Focus как участник команды.</p>
                </div>
              )}
            </section>

            <section className="overview-panel sidebar-info-card">
              <div className="section-mini-head section-mini-head-compact">
                <div>
                  <h3>Состояние Focus</h3>
                  <p>Короткий срез по прогрессу.</p>
                </div>
              </div>
              <div className="sidebar-stat-grid">
                <article><span>Прогресс</span><strong>{progress}%</strong></article>
                <article><span>Активных</span><strong>{focus.tasks.length - completedCount}</strong></article>
                <article><span>Completed</span><strong>{completedCount}</strong></article>
                <article>
                  <span>Роль</span>
                  <strong>{focus.accessRole === 'owner' ? 'Owner' : 'Member'}</strong>
                </article>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === 'chat' ? (
        <AiChat focusId={focusId!} token={token!} isOwner={canManageFocus} />
      ) : null}

      {activeTab === 'overview' ? (
        <section className="overview-panel overview-panel-rich tab-panel-shell">
          <div className="section-mini-head align-start" style={{ marginBottom: '20px' }}>
            <div>
              <h3>Overview</h3>
              <p>Краткая картина по задачам и составу команды.</p>
            </div>
          </div>
          <div className="stats-grid two-columns" style={{ marginBottom: '16px' }}>
            {[
              { icon: <IconActivity size={14} />, label: 'Открыто', value: focus.tasks.length - completedCount },
              { icon: <IconCheckCircle size={14} />, label: 'Выполнено', value: completedCount },
              { icon: <IconUsers size={14} />, label: 'Участников', value: focus.collaboratorCount + 1 },
              { icon: <IconGrid size={14} />, label: 'Роль доступа', value: focus.accessRole === 'owner' ? 'Owner' : 'Member' },
            ].map(({ icon, label, value }) => (
              <article className="stat-card compact-card compact-card-rich" key={label}>
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {icon}
                  {label}
                </span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <p className="muted-text">Описание проекта: {focus.description}</p>
        </section>
      ) : null}

      {activeTab === 'files' ? (
        <section className="overview-panel placeholder-panel placeholder-panel-rich tab-panel-shell">
          <IconFolder size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <h3>Файлы проекта</h3>
          <p className="muted-text">
            Сейчас здесь placeholder-блок, но структура страницы уже готова к file upload модулю.
          </p>
        </section>
      ) : null}

      {activeTab === 'notes' ? (
        <section className="overview-panel placeholder-panel placeholder-panel-rich tab-panel-shell">
          <IconNote size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
          <h3>Заметки</h3>
          <p className="muted-text">
            Следующим слоем сюда можно добавить notes CRUD и шаринг по участникам Focus.
          </p>
        </section>
      ) : null}

      {canManageFocus ? (
        <FocusFormModal
          open={isFocusEditOpen}
          mode="edit"
          initialFocus={focus}
          onClose={() => setIsFocusEditOpen(false)}
          onSubmit={async (payload) => {
            if (!token || !focusId) return;
            await wrap(() => focusApi.update(focusId, payload, token));
            await loadFocus();
          }}
        />
      ) : null}

      <Modal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Удалить задачу"
        subtitle="Это действие нельзя отменить"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={() => setTaskToDelete(null)}>
              Отмена
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={async () => {
                if (!taskToDelete || !token) return;
                await wrap(() => focusApi.removeTask(taskToDelete.id, token));
                setTaskToDelete(null);
                await loadFocus();
              }}
            >
              <IconTrash size={13} />
              Удалить
            </button>
          </>
        }
      >
        <p className="muted-text">
          Задача «{taskToDelete?.title}» будет удалена из этого Focus.
        </p>
      </Modal>

      {canManageFocus ? (
        <Modal
          open={isFocusDeleteOpen}
          onClose={() => setIsFocusDeleteOpen(false)}
          title="Удалить Focus"
          subtitle="Все задачи внутри тоже будут удалены"
          footer={
            <>
              <button className="button button-secondary" type="button" onClick={() => setIsFocusDeleteOpen(false)}>
                Отмена
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={async () => {
                  if (!token || !focusId) return;
                  await wrap(() => focusApi.remove(focusId, token));
                  navigate('/app');
                }}
              >
                <IconTrash size={13} />
                Удалить Focus
              </button>
            </>
          }
        >
          <p className="muted-text">После удаления восстановить Focus уже не получится.</p>
        </Modal>
      ) : null}
    </div>
  );
};
