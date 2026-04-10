import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Проверяем сессию...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
};
