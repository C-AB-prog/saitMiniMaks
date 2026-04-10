export const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  return value.trim();
};

export const isValidPhone = (value: string) => /^\+?[1-9]\d{7,14}$/.test(normalizePhone(value));

export const formatPhone = (value: string) => {
  const normalized = normalizePhone(value);
  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  return normalized;
};
