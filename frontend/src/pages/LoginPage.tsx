import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidPhone, normalizePhone } from '../utils/phone';
import { IconPhone, IconLock } from '../components/ui/Icons';

type LoginValues = {
  phone: string;
  password: string;
};

const bullets = [
  'Отдельные Focus для проектов, направлений и клиентов.',
  'Командная работа по приглашению через номер телефона.',
  'Подготовленная база для следующего AI-слоя.'
];

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>();

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login({ phone: normalizePhone(values.phone), password: values.password });
      navigate('/app');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось войти.');
    }
  });

  return (
    <div className="auth-page auth-page-rich">
      <div className="auth-layout-shell">
        <section className="auth-side-card">
          <span className="eyebrow-badge">Premium workspace</span>
          <h2>Возвращайтесь в систему роста без хаоса</h2>
          <p>
            Один аккаунт, несколько Focus, общие задачи и чистая структура для будущего AI-ассистента.
          </p>
          <div className="auth-side-bullets">
            {bullets.map((item) => (
              <div key={item} className="auth-side-bullet">
                <span style={{ color: 'var(--accent-vivid)', fontSize: '8px', marginTop: '6px' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                    <circle cx="4" cy="4" r="4"/>
                  </svg>
                </span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className="auth-side-stats">
            <article>
              <strong>Focus</strong>
              <span>Отдельный контекст для каждого проекта</span>
            </article>
            <article>
              <strong>Team</strong>
              <span>Приглашения по телефону без лишней сложности</span>
            </article>
          </div>
        </section>

        <form className="auth-card auth-card-rich" onSubmit={submit}>
          <div className="auth-header auth-header-rich">
            <Link to="/" className="brand-mark center-brand">Assistant Grows</Link>
            <h1>Вход</h1>
            <p>Войдите по телефону и паролю, чтобы открыть свои Focus.</p>
          </div>

          <label className={`field-group ${errors.phone ? 'is-invalid' : ''}`}>
            <span className="field-label">
              <IconPhone size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              Телефон
            </span>
            <input
              className="text-input control-large"
              placeholder="+7 930 750 75 43"
              aria-invalid={errors.phone ? 'true' : 'false'}
              {...register('phone', {
                required: 'Введите телефон.',
                validate: (value) => isValidPhone(value) || 'Введите корректный номер телефона.'
              })}
              onBlur={(event) => setValue('phone', normalizePhone(event.target.value), { shouldValidate: true })}
            />
            {errors.phone ? (
              <span className="field-error">{errors.phone.message}</span>
            ) : (
              <span className="field-hint">Телефон — ваш логин в системе.</span>
            )}
          </label>

          <label className={`field-group ${errors.password ? 'is-invalid' : ''}`}>
            <span className="field-label">
              <IconLock size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              Пароль
            </span>
            <input
              className="text-input control-large"
              type="password"
              placeholder="Минимум 8 символов"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password', {
                required: 'Введите пароль.',
                minLength: { value: 8, message: 'Минимум 8 символов.' }
              })}
            />
            {errors.password ? (
              <span className="field-error">{errors.password.message}</span>
            ) : (
              <span className="field-hint">Пароль чувствителен к регистру.</span>
            )}
          </label>

          {error ? <div className="notice notice-error">{error}</div> : null}

          <button
            className="button button-primary button-block button-large auth-submit-button auth-submit-button-deluxe"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Входим...' : 'Войти'}
          </button>

          <div className="auth-footer-cta">
            <p className="auth-footer-text">Нет аккаунта?</p>
            <Link className="auth-footer-link auth-footer-link-prominent" to="/register">
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
