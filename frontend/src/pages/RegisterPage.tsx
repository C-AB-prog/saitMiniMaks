import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidPhone, normalizePhone } from '../utils/phone';

type RegisterValues = {
  name: string;
  phone: string;
  password: string;
};

const bullets = [
  'Создавайте Focus с собственной обложкой и понятной целью.',
  'Добавляйте людей по номеру телефона в пару кликов.',
  'Готовьте фундамент для будущего AI-стратега внутри каждого Focus.'
];

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>();

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await registerUser({
        ...values,
        name: values.name.trim(),
        phone: normalizePhone(values.phone)
      });
      navigate('/app');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось зарегистрироваться.');
    }
  });

  return (
    <div className="auth-page auth-page-rich">
      <div className="auth-layout-shell">
        <section className="auth-side-card">
          <span className="eyebrow-badge">Build business with AI</span>
          <h2>Начните собирать свою рабочую систему уже сейчас</h2>
          <p>
            Регистрация без SMS на этом этапе: имя, телефон и пароль. Дальше вы сразу попадаете в продукт и создаёте первый Focus.
          </p>
          <div className="auth-side-bullets">
            {bullets.map((item) => (
              <div key={item} className="auth-side-bullet">
                <span>✦</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className="auth-side-stats">
            <article>
              <strong>Clean UI</strong>
              <span>Темная premium-подача без системной грубости</span>
            </article>
            <article>
              <strong>Ready to scale</strong>
              <span>Backend, database, auth, uploads и shared Focus уже на месте</span>
            </article>
          </div>
        </section>

        <form className="auth-card auth-card-rich" onSubmit={submit}>
          <div className="auth-header auth-header-rich">
            <Link to="/" className="brand-mark center-brand">
              Assistant Grows
            </Link>
            <h1>Регистрация</h1>
            <p>Имя, телефон и пароль — без SMS на этом этапе.</p>
          </div>

          <label className={`field-group ${errors.name ? 'is-invalid' : ''}`}>
            <span className="field-label">Имя</span>
            <input
              className="text-input control-large"
              placeholder="Например: Дмитрий"
              aria-invalid={errors.name ? 'true' : 'false'}
              {...register('name', {
                required: 'Введите имя.',
                minLength: { value: 2, message: 'Минимум 2 символа.' },
                maxLength: { value: 80, message: 'Слишком длинное имя.' }
              })}
            />
            {errors.name ? <span className="field-error">{errors.name.message}</span> : <span className="field-hint">Имя будет видно участникам ваших Focus.</span>}
          </label>

          <label className={`field-group ${errors.phone ? 'is-invalid' : ''}`}>
            <span className="field-label">Телефон</span>
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
            {errors.phone ? <span className="field-error">{errors.phone.message}</span> : <span className="field-hint">Телефон используется как логин и для приглашений в команду.</span>}
          </label>

          <label className={`field-group ${errors.password ? 'is-invalid' : ''}`}>
            <span className="field-label">Пароль</span>
            <input
              className="text-input control-large"
              type="password"
              placeholder="Минимум 8 символов"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password', {
                required: 'Введите пароль.',
                minLength: { value: 8, message: 'Минимум 8 символов.' },
                maxLength: { value: 72, message: 'Максимум 72 символа.' }
              })}
            />
            {errors.password ? <span className="field-error">{errors.password.message}</span> : <span className="field-hint">Лучше использовать не только цифры.</span>}
          </label>

          {error ? <div className="notice notice-error">{error}</div> : null}

          <button className="button button-primary button-block button-large auth-submit-button auth-submit-button-deluxe" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаём...' : 'Создать аккаунт'}
          </button>

          <div className="auth-footer-cta">
            <p className="auth-footer-text auth-footer-text-rich">Уже есть аккаунт?</p>
            <Link className="auth-footer-link auth-footer-link-prominent" to="/login">Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
