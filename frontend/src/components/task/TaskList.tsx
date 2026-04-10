import { formatDateLabel } from '../../utils/date';
import type { Task } from '../../types/api';
import { EmptyState } from '../ui/EmptyState';
import { IconCalendar, IconEdit, IconTrash, IconCheckCircle, IconActivity } from '../ui/Icons';

type TaskListProps = {
  tasks: Task[];
  selectedDate?: string | null;
  statusFilter: 'all' | 'completed' | 'incomplete';
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export const TaskList = ({ tasks, selectedDate, statusFilter, onToggle, onEdit, onDelete }: TaskListProps) => {
  if (!tasks.length) {
    return (
      <EmptyState
        title="Задач пока нет"
        description="Создайте первую задачу для этого Focus или измените фильтр."
      />
    );
  }

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const showCompletedSection =
    statusFilter !== 'incomplete' &&
    (selectedDate !== null || statusFilter === 'completed' || completedTasks.length > 0);

  const renderTaskCard = (task: Task) => (
    <article key={task.id} className={`task-card ${task.completed ? 'is-complete' : ''}`}>
      <div className="task-card-top task-card-top-closer">
        <button
          className={`checkbox-pill ${task.completed ? 'is-complete' : ''}`}
          type="button"
          onClick={() => void onToggle(task.id)}
          aria-label={task.completed ? 'Отметить как активную' : 'Отметить как выполненную'}
        >
          {task.completed ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : null}
        </button>

        <div className="task-copy">
          <div className="task-title-row">
            <h3>{task.title}</h3>
            <span className={`task-state-pill ${task.completed ? 'done' : 'active'}`}>
              {task.completed ? 'Done' : 'In progress'}
            </span>
          </div>
          {task.description ? <p>{task.description}</p> : null}
        </div>

        <div className="task-actions">
          <button
            className="button button-secondary button-small"
            type="button"
            onClick={() => onEdit(task)}
            style={{ gap: '5px' }}
          >
            <IconEdit size={12} />
            Редактировать
          </button>
          <button
            className="button button-danger button-small"
            type="button"
            onClick={() => onDelete(task)}
            style={{ gap: '5px' }}
          >
            <IconTrash size={12} />
            Удалить
          </button>
        </div>
      </div>

      <div className="task-meta-row task-meta-row-closer">
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <IconCalendar size={12} />
          {formatDateLabel(task.dueDate)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {task.completed ? (
            <><IconCheckCircle size={12} style={{ color: 'var(--success)' }} /> Выполнено</>
          ) : (
            <><IconActivity size={12} style={{ color: 'var(--accent-vivid)' }} /> В работе</>
          )}
        </span>
      </div>
    </article>
  );

  return (
    <div className="task-columns task-columns-polished">
      {statusFilter !== 'completed' ? (
        <section className="task-section-card">
          <div className="section-row" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Активные задачи</h3>
              <p className="muted-text">То, что ещё нужно сделать и довести до результата.</p>
            </div>
            <span className="count-pill">{activeTasks.length}</span>
          </div>
          <div className="stack-md">
            {activeTasks.length ? (
              activeTasks.map(renderTaskCard)
            ) : (
              <EmptyState title="Здесь пусто" description="По текущему фильтру нет активных задач." />
            )}
          </div>
        </section>
      ) : null}

      {showCompletedSection ? (
        <section className="task-section-card completed-section-card">
          <div className="section-row" style={{ marginBottom: '16px' }}>
            <div>
              <h3>{selectedDate ? 'Выполненные за выбранный день' : 'Выполненные задачи'}</h3>
              <p className="muted-text">
                {selectedDate
                  ? 'Отдельный блок completed за конкретную дату.'
                  : 'Completed задачи видны всем участникам Focus.'}
              </p>
            </div>
            <span className="count-pill">{completedTasks.length}</span>
          </div>
          <div className="stack-md">
            {completedTasks.length ? (
              completedTasks.map(renderTaskCard)
            ) : (
              <EmptyState title="Пока пусто" description="По текущему фильтру нет выполненных задач." />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};
