export const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Без даты';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short'
  }).format(date);
};

export const isSameDate = (left?: string | null, right?: string | null) => left === right;

export const todayDateString = () => toDateInputValue(new Date());

export const monthMatrix = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ value: string; day: number } | null> = [];

  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({ value: toDateInputValue(new Date(year, month, day)), day });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};
