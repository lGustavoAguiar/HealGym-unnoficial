import { GlobalStyles } from './styles/GlobalStyles'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import RegisterPage from './components/RegisterPage'
import LoginPage from './components/LoginPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import ConfirmDeletePage from './components/ConfirmDeletePage'
import ProfileSetupPage from './components/ProfileSetupPage'
import EditProfilePage from './components/EditProfilePage'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ProfileSetupGuard from './components/ProfileSetupGuard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalStyles />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/confirm-delete/:token" element={<ConfirmDeletePage />} />
          <Route 
            path="/profile-setup" 
            element={
              <ProtectedRoute>
                <ProfileSetupPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-profile" 
            element={
              <ProtectedRoute>
                <ProfileSetupGuard>
                  <EditProfilePage />
                </ProfileSetupGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ProfileSetupGuard>
                  <Dashboard />
                </ProfileSetupGuard>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
