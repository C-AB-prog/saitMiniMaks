const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isDateOnly = (value: string) => DATE_ONLY_PATTERN.test(value);

export const compareDateOnly = (left: string, right: string) => left.localeCompare(right);
