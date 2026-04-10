import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconTarget,
  IconBrain,
  IconCheckSquare,
  IconBarChart,
  IconNote,
  IconFolder,
  IconUsers,
  IconList,
  IconBolt,
} from '../components/ui/Icons';

const features = [
  { Icon: IconTarget,    title: 'Система фокусов',       description: 'Отдельные рабочие пространства для каждого проекта. Разделяйте контекст и сохраняйте концентрацию.' },
  { Icon: IconBrain,     title: 'AI бизнес-наставник',   description: 'Не чат-бот. Стратег и советник, который знает ваш контекст и помогает принимать решения.' },
  { Icon: IconCheckSquare, title: 'Умное планирование',  description: 'Задачи с календарём, фильтрами и стабильной датой. Никаких timezone-сдвигов.' },
  { Icon: IconBarChart,  title: 'Прогресс и аналитика',  description: 'Полная картина: что открыто, что завершено и куда уходит основной фокус команды.' },
  { Icon: IconUsers,     title: 'Командная работа',      description: 'Добавляйте людей по номеру телефона. Отдельные роли, общий контекст, чистый доступ.' },
  { Icon: IconFolder,    title: 'Файлы и заметки',       description: 'Архитектура уже готова: файловый модуль и заметки подключатся без перестройки.' },
];

const steps = [
  { Icon: IconTarget, number: '01', title: 'Создайте Focus', description: 'Задайте контекст: название, описание, обложка. Всё это потом использует AI.' },
  { Icon: IconList,   number: '02', title: 'Соберите задачи', description: 'Планируйте по дням, фильтруйте и отслеживайте прогресс. Без хаоса.' },
  { Icon: IconBolt,   number: '03', title: 'Запускайте AI', description: 'AI знает ваш проект, задачи и команду. Помогает строить бизнес — конкретно.' },
];

const stats = [
  { value: '∞', label: 'Focus на каждый проект' },
  { value: 'AI', label: 'Бизнес-наставник внутри' },
  { value: '100%', label: 'Context-aware ответы' },
];

export const LandingPage = () => {
  const { user } = useAuth();
  const homeLink = user ? '/app' : '/';

  return (
    <div className="landing-root">
      <header className="landing-topbar full-width-topbar">
        <Link to={homeLink} className="brand-mark">
          Assistant Grows
        </Link>
        <nav className="topbar-nav desktop-nav">
          <a href="#features" className="topbar-link">Возможности</a>
          <a href="#how-it-works" className="topbar-link">Как работает</a>
        </nav>
        <div className="topbar-actions">
          {user ? (
            <>
              <span className="topbar-user-hint">Привет, {user.name}</span>
              <Link className="button button-primary" to="/app">Открыть workspace</Link>
            </>
          ) : (
            <>
              <Link className="button button-secondary" to="/login">Войти</Link>
              <Link className="button button-primary" to="/register">Начать</Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-page landing-page-expanded">

        {/* ── HERO ── */}
        <section className="hero-panel hero-panel-landing">
          <span className="eyebrow-badge animate-fade-in">
            AI-Powered Business Growth Platform
          </span>
          <h1
            className="animate-fade-up"
            style={{
              animationDelay: '.1s',
              background: 'linear-gradient(135deg, #eeeef5 0%, #a5b4fc 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Строй бизнес<br />с AI-наставником
          </h1>
          <p className="animate-fade-up" style={{ animationDelay: '.18s' }}>
            Assistant Grows — система фокуса, где каждый проект получает свой контекст, задачи, команду
            и AI-советника, который знает, чем вы занимаетесь.
          </p>
          <div className="hero-actions center-actions animate-fade-up" style={{ animationDelay: '.26s' }}>
            <Link className="button button-primary button-large" to={user ? '/app' : '/register'}>
              {user ? 'Перейти в приложение' : 'Начать бесплатно'}
            </Link>
            <a className="button button-secondary button-large" href="#features">
              Узнать больше
            </a>
          </div>

          {/* ── mini stats inside hero ── */}
          <div
            className="animate-fade-up"
            style={{
              animationDelay: '.34s',
              display: 'flex',
              gap: 32,
              justifyContent: 'center',
              marginTop: 40,
              flexWrap: 'wrap',
            }}
          >
            {stats.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                  background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                  marginBottom: 6,
                }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.04em' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PREVIEW CARDS ── */}
        <section className="landing-preview-grid">
          {[
            { kicker: 'Shared Focus', title: 'Команда по телефону', desc: 'Приглашения без лишней сложности. Отдельный доступ по ролям.', delay: '0s' },
            { kicker: 'Clean workflow', title: 'Задачи + календарь', desc: 'Собранная task-зона без системных окон и timezone-сдвигов.', delay: '.06s' },
            { kicker: 'AI-ready', title: 'Реальный AI внутри', desc: 'Не заглушка — GPT-ассистент, который знает контекст вашего Focus.', delay: '.12s' },
          ].map((item) => (
            <article
              key={item.kicker}
              className="landing-preview-card animate-fade-up"
              style={{ animationDelay: item.delay }}
            >
              <span className="landing-preview-kicker">{item.kicker}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </section>

        {/* ── FEATURES ── */}
        <section className="marketing-section" id="features">
          <div className="section-header-stack">
            <span className="eyebrow-badge">Возможности</span>
            <h2>Всё для роста вашего бизнеса</h2>
            <p>Каждый Focus — рабочая среда с задачами, AI-советником и командой.</p>
          </div>
          <div className="feature-grid-section feature-grid-landing">
            {features.map(({ Icon, title, description }, i) => (
              <article
                key={title}
                className="feature-card-panel feature-card-rich animate-fade-up"
                style={{ animationDelay: `${i * .07}s` }}
              >
                <div className="feature-icon-badge">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="marketing-section" id="how-it-works">
          <div className="section-header-stack">
            <span className="eyebrow-badge">Как это работает</span>
            <h2>Три шага к результату</h2>
            <p>От идеи до AI-советника — без лишней настройки.</p>
          </div>
          <div className="steps-grid">
            {steps.map(({ Icon, number, title, description }, i) => (
              <article
                key={number}
                className="step-card animate-fade-up"
                style={{ animationDelay: `${i * .1}s` }}
              >
                <div className="step-number-badge">
                  <Icon size={24} style={{ color: 'white' }} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase' as const,
                    marginBottom: 6,
                  }}>
                    Шаг {number}
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── CTA BOTTOM ── */}
        <section
          className="hero-panel animate-fade-up"
          style={{
            padding: 'clamp(48px,8vw,80px) clamp(24px,6vw,80px)',
            textAlign: 'center',
          }}
        >
          <span className="eyebrow-badge" style={{ marginBottom: 24 }}>Готов к запуску</span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px,5vw,52px)',
              letterSpacing: '-0.045em',
              margin: '0 auto 16px',
              maxWidth: 560,
              background: 'linear-gradient(135deg, #eeeef5 0%, #a5b4fc 60%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Создай первый Focus прямо сейчас
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 32px', fontSize: 16 }}>
            Регистрация занимает 30 секунд. Без карты, без SMS.
          </p>
          <Link className="button button-primary button-large" to={user ? '/app' : '/register'}>
            {user ? 'Перейти в приложение' : 'Начать бесплатно'}
          </Link>
        </section>

      </main>
    </div>
  );
};
