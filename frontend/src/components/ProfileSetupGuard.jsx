import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const ProfileSetupGuard = ({ children }) => {
  const { loading, isAuthenticated, needsProfileSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário está na página de setup, deixe-o ficar
  if (location.pathname === '/profile-setup') {
    return children;
  }

  // Se o usuário não completou o setup do perfil, redirecione para a página de setup
  if (needsProfileSetup()) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProfileSetupGuard;
