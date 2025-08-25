import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Primeiro tenta carregar do localStorage para ter dados imediatamente
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAuthenticated(true);
              console.log('✅ Dados do usuário carregados do localStorage:', userData);
            } catch (parseError) {
              console.error('Erro ao parsear dados do usuário do localStorage:', parseError);
            }
          }

          // Depois verifica com o servidor para garantir que está atualizado
          const response = await apiService.verifyToken();
          if (response.valid) {
            setUser(response.user);
            setIsAuthenticated(true);
            // Atualiza o localStorage com os dados mais recentes
            localStorage.setItem('user', JSON.stringify(response.user));
            console.log('✅ Dados do usuário atualizados do servidor:', response.user);
          } else {
            apiService.logout();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        apiService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      // Garantir que os dados são salvos no localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      // Garantir que os dados são salvos no localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Limpar também do localStorage
    localStorage.removeItem('user');
  };

  const updateUser = (userData) => {
    setUser(userData);
    // Também atualizar no localStorage para sincronizar
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const needsProfileSetup = () => {
    return user && !user.profileSetupCompleted;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
      needsProfileSetup
    }}>
      {children}
    </AuthContext.Provider>
  );
};
