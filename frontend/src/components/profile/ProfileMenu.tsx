import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconLogOut, IconUser } from '../ui/Icons';

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="profile-topbar-actions">
      <button
        className="profile-chip profile-chip-rich"
        type="button"
        onClick={() => navigate('/app/profile')}
        title="Профиль"
      >
        <span className="profile-chip-avatar">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="profile-chip-copy">
          <strong>{user.name}</strong>
          <small>{user.phone}</small>
        </span>
        <IconUser size={12} style={{ color: 'var(--text-tertiary)', marginLeft: 2 }} />
      </button>
      <button
        className="icon-button"
        type="button"
        onClick={logout}
        title="Выйти"
        style={{ borderRadius: '50%' }}
      >
        <IconLogOut size={14} />
      </button>
    </div>
  );
};
