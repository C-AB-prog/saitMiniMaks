import { Link, NavLink, Outlet } from 'react-router-dom';
import { ProfileMenu } from '../profile/ProfileMenu';
import { IconHome, IconUser } from '../ui/Icons';

export const AppShell = () => {
  return (
    <div className="app-shell">
      <header className="topbar full-width-topbar">
        <Link to="/app" className="brand-mark">
          Assistant Grows
        </Link>
        <nav className="topbar-nav desktop-nav">
          <NavLink to="/app" end className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            <IconHome size={14} />
            Главная
          </NavLink>
          <NavLink to="/app/profile" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            <IconUser size={14} />
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
