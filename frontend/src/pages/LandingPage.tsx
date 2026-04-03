import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: '🎯',
    title: 'Система фокусов',
    description: 'Создавайте отдельные рабочие пространства для каждого проекта. Разделяйте контекст и сохраняйте концентрацию.'
  },
  {
    icon: '🤖',
    title: 'AI бизнес-наставник',
    description: 'Не просто чат-бот. Аналитик, стратег и советник, который помогает принимать решения и двигаться к цели.'
  },
  {
    icon: '✅',
    title: 'Умное планирование',
    description: 'Гибридная система задач с календарём, фильтрами и стабильной датой без timezone-сдвигов.'
  },
  {
    icon: '📊',
    title: 'Прогресс и аналитика',
    description: 'Видьте полную картину: что открыто, что завершено и куда уходит основной фокус команды.'
  },
  {
    icon: '💡',
    title: 'Заметки и идеи',
    description: 'Структура уже готова к следующему этапу: заметкам, AI-контексту и дополнительным материалам внутри Focus.'
  },
  {
    icon: '📁',
    title: 'Файлы проекта',
    description: 'Обложки уже работают через backend uploads, а файловый модуль оставлен future-ready без ломки архитектуры.'
  }
];

const previewStats = [
  { title: 'Shared Focus', value: 'Команда по телефону', description: 'Приглашения без лишней сложности и отдельный доступ по ролям.' },
  { title: 'Clean workflow', value: 'Задачи + календарь', description: 'Собранная task-зона без системных окон и timezone-сдвигов.' },
  { title: 'AI-ready base', value: 'Следующий слой', description: 'Архитектура уже готова для реального бизнес-ассистента.' }
];

const steps = [
  {
    number: '1',
    title: 'Создайте Focus',
    description: 'Задайте отдельный контекст для проекта, направления или продукта.'
  },
  {
    number: '2',
    title: 'Соберите задачи',
    description: 'Планируйте работу по дням, фильтруйте и отслеживайте прогресс без хаоса.'
  },
  {
    number: '3',
    title: 'Двигайтесь к результату',
    description: 'Стройте систему, которую легко развивать дальше: notes, files, AI и admin layer.'
  }
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
          <a href="#features" className="topbar-link">
            О продукте
          </a>
          <a href="#how-it-works" className="topbar-link">
            Как это работает
          </a>
        </nav>
        <div className="topbar-actions">
          {user ? (
            <>
              <span className="topbar-user-hint">Вы вошли как {user.name}</span>
              <Link className="button button-primary" to="/app">
                Открыть workspace
              </Link>
            </>
          ) : (
            <>
              <Link className="button button-secondary" to="/login">
                Войти
              </Link>
              <Link className="button button-primary" to="/register">
                Начать
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-page landing-page-expanded">
        <section className="hero-panel hero-panel-landing">
          <span className="eyebrow-badge">AI-Powered Business Growth Platform</span>
          <h1>
            Строй бизнес
            <br />
            с AI-наставником
          </h1>
          <p>
            Assistant Grows — это не таск-менеджер. Это система фокуса, где каждый проект получает свой контекст,
            задачи, обложку и основу для следующего AI-слоя.
          </p>
          <div className="hero-actions center-actions">
            <Link className="button button-primary button-large" to={user ? '/app' : '/register'}>
              {user ? 'Перейти в приложение' : 'Начать бесплатно'}
            </Link>
            <a className="button button-secondary button-large" href="#features">
              Узнать больше
            </a>
          </div>
        </section>

        <section className="landing-preview-grid">
          {previewStats.map((item) => (
            <article key={item.title} className="landing-preview-card">
              <span className="landing-preview-kicker">{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className="marketing-section" id="features">
          <div className="section-header-stack">
            <span className="eyebrow-badge">Возможности</span>
            <h2>Всё для роста вашего бизнеса</h2>
            <p>Каждый Focus — это отдельная рабочая среда с задачами, календарём и будущими AI-модулями.</p>
          </div>
          <div className="feature-grid-section feature-grid-landing">
            {features.map((feature) => (
              <article key={feature.title} className="feature-card-panel feature-card-rich">
                <div className="feature-icon-badge">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section" id="how-it-works">
          <div className="section-header-stack">
            <span className="eyebrow-badge">Как это работает</span>
            <h2>Три шага к результату</h2>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <article key={step.number} className="step-card">
                <div className="step-number-badge">{step.number}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
