const WEAK_PASSWORDS = new Set([
  '12345678', 'password', 'qwerty123', '11111111', 'password1',
  'abc12345', 'letmein1', 'iloveyou', 'admin123', 'welcome1',
  'monkey12', 'dragon12', 'master12', 'sunshine', 'princess',
]);

export const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 8) {
    return 'Пароль должен содержать минимум 8 символов.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну строчную букву.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну заглавную букву.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну цифру.';
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return 'Пароль должен содержать хотя бы один специальный символ (!@#$%^&* и т.д.).';
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'Пароль слишком простой. Используйте уникальную комбинацию символов.';
  }
  return null;
};
