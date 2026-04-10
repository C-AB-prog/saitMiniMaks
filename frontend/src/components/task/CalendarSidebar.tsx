import { monthMatrix, todayDateString } from '../../utils/date';
import type { Task } from '../../types/api';
import { IconChevronL, IconChevronR } from '../ui/Icons';

type CalendarSidebarProps = {
  month: number;
  year: number;
  selectedDate: string | null;
  tasks: Task[];
  onChangeMonth: (delta: number) => void;
  onSelectDate: (date: string | null) => void;
};

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const CalendarSidebar = ({ month, year, selectedDate, tasks, onChangeMonth, onSelectDate }: CalendarSidebarProps) => {
  const matrix = monthMatrix(year, month);
  const today = todayDateString();
  const taskMap = new Map<string, { total: number; completed: number }>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const next = taskMap.get(task.dueDate) ?? { total: 0, completed: 0 };
    next.total += 1;
    if (task.completed) next.completed += 1;
    taskMap.set(task.dueDate, next);
  }

  return (
    <aside className="calendar-card">
      <div className="calendar-head">
        <h3>
          {new Date(year, month, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="calendar-nav-row">
          <button className="icon-button" type="button" onClick={() => onChangeMonth(-1)} aria-label="Предыдущий месяц">
            <IconChevronL size={14} />
          </button>
          <button
            className="button button-secondary button-small"
            type="button"
            onClick={() => onSelectDate(today)}
          >
            Сегодня
          </button>
          <button className="icon-button" type="button" onClick={() => onChangeMonth(1)} aria-label="Следующий месяц">
            <IconChevronR size={14} />
          </button>
        </div>
      </div>

      <div className="calendar-grid-wrap">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        {matrix.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} className="calendar-cell empty" />;
          const stat = taskMap.get(cell.value);
          const classNames = ['calendar-cell'];
          if (cell.value === today) classNames.push('today');
          if (selectedDate === cell.value) classNames.push('selected');
          if (stat?.total) classNames.push(stat.completed === stat.total ? 'all-done' : 'has-tasks');
          return (
            <button
              key={cell.value}
              className={classNames.join(' ')}
              type="button"
              onClick={() => onSelectDate(cell.value)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend-row">
        <button
          className="button button-secondary button-small"
          type="button"
          onClick={() => onSelectDate(null)}
          style={{ width: '100%' }}
        >
          Показать все даты
        </button>
      </div>
    </aside>
  );
};
