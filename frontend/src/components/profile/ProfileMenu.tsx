import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="profile-topbar-actions">
      <button className="profile-chip profile-chip-rich" type="button" onClick={() => navigate('/app/profile')}>
        <span className="profile-chip-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
        <span className="profile-chip-copy">
          <strong>{user.name}</strong>
          <small>{user.phone}</small>
        </span>
      </button>
      <button className="button button-secondary button-small" type="button" onClick={logout}>
        Выйти
      </button>
    </div>
  );
};
