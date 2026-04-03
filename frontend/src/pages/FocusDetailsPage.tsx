import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { focusApi } from '../api/focuses';
import { fileUrl } from '../api/client';
import { FocusFormModal } from '../components/focus/FocusFormModal';
import { CalendarSidebar } from '../components/task/CalendarSidebar';
import { TaskForm } from '../components/task/TaskForm';
import { TaskList } from '../components/task/TaskList';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useAsyncState } from '../hooks/useAsyncState';
import type { Focus, Task } from '../types/api';
import { formatDateLabel } from '../utils/date';

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

  useEffect(() => {
    void loadFocus();
  }, [focusId, token]);

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
  const completedCount = focus?.tasks.filter((task) => task.completed).length ?? 0;
  const progress = focus?.tasks.length ? Math.round((completedCount / focus.tasks.length) * 100) : 0;
  const activeCount = filteredTasks.filter((task) => !task.completed).length;
  const completeFilteredCount = filteredTasks.filter((task) => task.completed).length;
  const canManageFocus = focus?.accessRole === 'owner';

  if (isLoading && !focus) return <div className="loading-card">Загружаем Focus...</div>;
  if (!focus) return <div className="notice notice-error">{error ?? 'Focus не найден.'}</div>;

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
                ← Назад
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
                      <button className="button button-secondary" type="button" onClick={() => setIsFocusEditOpen(true)}>
                        Редактировать
                      </button>
                      <button className="button button-danger" type="button" onClick={() => setIsFocusDeleteOpen(true)}>
                        Удалить
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="inline-chip-row inline-chip-row-rich focus-summary-chips-row">
                <span className="focus-chip">{focus.tasks.length} задач</span>
                <span className="focus-chip">{completedCount} выполнено</span>
                <span className="focus-chip">{progress}% прогресс</span>
                <span className="focus-chip">{focus.collaboratorCount + 1} участников</span>
              </div>
              <div className="member-stack-row">
                <div className="member-avatar owner">{focus.owner.name.slice(0, 1).toUpperCase()}</div>
                {focus.members.map((member) => (
                  <div key={member.id} className="member-avatar" title={`${member.name} · ${member.phone}`}>
                    {member.name.slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="focus-tabs-row focus-tabs-row-polished">
            {['tasks', 'chat', 'overview', 'files', 'notes'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`focus-tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => switchTab(tab as typeof activeTab)}
              >
                {tab === 'tasks' && 'Tasks'}
                {tab === 'chat' && 'Chat'}
                {tab === 'overview' && 'Overview'}
                {tab === 'files' && 'Files'}
                {tab === 'notes' && 'Notes'}
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

            <section className="page-stack section-card-shell section-card-shell-tasks task-main-shell">
              <div className="task-toolbar task-toolbar-candy">
                <div className="task-toolbar-main task-toolbar-main-fixed">
                  <h2 className="section-title-large">Задачи</h2>
                  <div className="filter-button-group filter-button-group-single-row filter-button-group-fixed-one-row" role="tablist" aria-label="Фильтр задач">
                    <button className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('all')}>
                      Все
                    </button>
                    <button className={`filter-button ${statusFilter === 'incomplete' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('incomplete')}>
                      Активные
                    </button>
                    <button className={`filter-button ${statusFilter === 'completed' ? 'active' : ''}`} type="button" onClick={() => setStatusFilter('completed')}>
                      Выполненные
                    </button>
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
                      <button className="button button-secondary button-small" type="button" onClick={() => setSelectedDate(null)}>
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

            <section className="team-panel-card team-panel-card-polished team-panel-card-secondary team-panel-card-after-calendar">
              <div className="section-mini-head section-mini-head-polished">
                <div>
                  <h3>Команда Focus</h3>
                  <p>Добавляйте людей по номеру телефона и работайте вместе внутри одного пространства.</p>
                </div>
                <span className="focus-chip emphasis">{focus.collaboratorCount + 1}</span>
              </div>

              <div className="team-owner-highlight">
                <div className="member-avatar owner large">{focus.owner.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{focus.owner.name}</strong>
                  <span>{focus.owner.phone} · владелец</span>
                </div>
              </div>

              <div className="team-member-list team-member-list-polished">
                {focus.members.length ? (
                  focus.members.map((member) => (
                    <article key={member.id} className="team-member-row team-member-row-polished">
                      <div className="member-avatar">{member.name.slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{member.name}</strong>
                        <span>{member.phone}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="subtle-empty-card">Пока в Focus нет приглашённых участников.</div>
                )}
              </div>

              {canManageFocus ? (
                <div className="team-note-card">
                  <strong>Управление командой</strong>
                  <p>Добавлять и удалять людей можно через кнопку «Редактировать» в шапке Focus.</p>
                </div>
              ) : (
                <div className="team-note-card soft">
                  <strong>Совместный доступ</strong>
                  <p>Вы видите этот Focus как участник команды и можете работать с общими задачами.</p>
                </div>
              )}
            </section>

            <section className="overview-panel sidebar-info-card sidebar-info-card-compact">
              <div className="section-mini-head section-mini-head-compact">
                <div>
                  <h3>Состояние Focus</h3>
                  <p>Короткий срез по прогрессу и роли доступа.</p>
                </div>
              </div>
              <div className="sidebar-stat-grid">
                <article>
                  <span>Прогресс</span>
                  <strong>{progress}%</strong>
                </article>
                <article>
                  <span>Активных</span>
                  <strong>{focus.tasks.length - completedCount}</strong>
                </article>
                <article>
                  <span>Completed</span>
                  <strong>{completedCount}</strong>
                </article>
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
        <section className="overview-panel placeholder-panel placeholder-panel-rich tab-panel-shell">
          <h3>AI Бизнес-Наставник</h3>
          <p className="muted-text">Вкладка сохранена future-ready: позже сюда можно подключить реальный chat context по каждому Focus без перестройки страницы.</p>
        </section>
      ) : null}

      {activeTab === 'overview' ? (
        <section className="overview-panel overview-panel-rich tab-panel-shell">
          <div className="section-mini-head align-start">
            <div>
              <h3>Overview</h3>
              <p>Краткая картина по задачам и составу команды.</p>
            </div>
          </div>
          <div className="stats-grid two-columns stats-grid-rich">
            <article className="stat-card compact-card compact-card-rich">
              <span className="stat-card-label">Открыто</span>
              <strong>{focus.tasks.length - completedCount}</strong>
            </article>
            <article className="stat-card compact-card compact-card-rich">
              <span className="stat-card-label">Выполнено</span>
              <strong>{completedCount}</strong>
            </article>
            <article className="stat-card compact-card compact-card-rich">
              <span className="stat-card-label">Участников</span>
              <strong>{focus.collaboratorCount + 1}</strong>
            </article>
            <article className="stat-card compact-card compact-card-rich">
              <span className="stat-card-label">Роль доступа</span>
              <strong>{focus.accessRole === 'owner' ? 'Owner' : 'Member'}</strong>
            </article>
          </div>
          <p className="muted-text">Описание проекта: {focus.description}</p>
        </section>
      ) : null}

      {activeTab === 'files' ? (
        <section className="overview-panel placeholder-panel placeholder-panel-rich tab-panel-shell">
          <h3>Файлы проекта</h3>
          <p className="muted-text">Сейчас здесь placeholder-блок, но структура страницы уже готова к file upload модулю.</p>
        </section>
      ) : null}

      {activeTab === 'notes' ? (
        <section className="overview-panel placeholder-panel placeholder-panel-rich tab-panel-shell">
          <h3>Заметки</h3>
          <p className="muted-text">Следующим слоем сюда можно добавить notes CRUD и шаринг по участникам Focus.</p>
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
              Удалить
            </button>
          </>
        }
      >
        <p className="muted-text">Задача «{taskToDelete?.title}» будет удалена из этого Focus.</p>
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
