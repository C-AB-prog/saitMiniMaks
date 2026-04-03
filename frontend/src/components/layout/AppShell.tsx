import { Link, NavLink, Outlet } from 'react-router-dom';
import { ProfileMenu } from '../profile/ProfileMenu';

export const AppShell = () => {
  return (
    <div className="app-shell">
      <header className="topbar full-width-topbar">
        <Link to="/app" className="brand-mark">
          Assistant Grows
        </Link>
        <nav className="topbar-nav desktop-nav">
          <NavLink to="/app" end className="topbar-link">
            Главная
          </NavLink>
          <NavLink to="/app/profile" className="topbar-link">
            Профиль
          </NavLink>
        </nav>
        <ProfileMenu />
      </header>
      <main className="app-main app-main-closer">
        <Outlet />
      </main>
    </div>
  );
};
