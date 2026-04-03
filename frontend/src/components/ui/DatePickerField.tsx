import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateLabel, monthMatrix, todayDateString } from '../../utils/date';

type DatePickerFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DatePickerField = ({ label, value, onChange, hint, error }: DatePickerFieldProps) => {
  const today = todayDateString();
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return null;
    return { year, month: month - 1 };
  }, [value]);

  const todayParts = useMemo(() => {
    const [year, month] = today.split('-').map(Number);
    return { year, month: month - 1 };
  }, [today]);

  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => parsedValue ?? todayParts);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (parsedValue) setCursor(parsedValue);
  }, [parsedValue]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const matrix = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const title = useMemo(
    () => new Date(cursor.year, cursor.month, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
    [cursor]
  );

  const className = ['field-group', 'date-picker-field', error ? 'is-invalid' : ''].filter(Boolean).join(' ');

  return (
    <div className={className} ref={rootRef}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        className={`date-picker-trigger ${value ? '' : 'is-empty'} ${open ? 'is-open' : ''}`.trim()}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="date-picker-trigger-copy">
          <strong>{value ? formatDateLabel(value) : 'Выбрать дату'}</strong>
          <small>{value ? 'Дата сохранится без сдвига по timezone' : 'Без системного календаря браузера'}</small>
        </span>
        <span className="date-picker-trigger-icon">▾</span>
      </button>

      {open ? (
        <div className="date-picker-popover">
          <div className="date-picker-header">
            <button type="button" className="icon-button" onClick={() => setCursor((prev) => {
              const next = new Date(prev.year, prev.month - 1, 1);
              return { year: next.getFullYear(), month: next.getMonth() };
            })}>
              ‹
            </button>
            <strong>{title}</strong>
            <button type="button" className="icon-button" onClick={() => setCursor((prev) => {
              const next = new Date(prev.year, prev.month + 1, 1);
              return { year: next.getFullYear(), month: next.getMonth() };
            })}>
              ›
            </button>
          </div>

          <div className="date-picker-grid">
            {weekDays.map((day) => (
              <span key={day} className="date-picker-weekday">
                {day}
              </span>
            ))}
            {matrix.map((cell, index) => {
              if (!cell) return <span key={`empty-${index}`} className="date-picker-cell empty" />;
              const selected = cell.value === value;
              const isToday = cell.value === today;
              return (
                <button
                  key={cell.value}
                  type="button"
                  className={`date-picker-cell ${selected ? 'selected' : ''} ${isToday ? 'today' : ''}`.trim()}
                  onClick={() => {
                    onChange(cell.value);
                    setOpen(false);
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Без даты
            </button>
            <button
              type="button"
              className="button button-primary button-small"
              onClick={() => {
                onChange(today);
                setOpen(false);
              }}
            >
              Сегодня
            </button>
          </div>
        </div>
      ) : null}

      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
};
