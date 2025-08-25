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

  if (location.pathname === '/profile-setup') {
    return children;
  }

  if (needsProfileSetup()) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProfileSetupGuard;
