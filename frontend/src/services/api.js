const API_BASE_URL = '/api';

console.log('🔍 API Base URL:', API_BASE_URL);
console.log('🔍 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
console.log('🔍 Current port:', typeof window !== 'undefined' ? window.location.port : 'SSR');

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 Making request to: ${url}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token found and added to headers');
    } else {
      console.log('⚠️ No token found in localStorage');
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || 'Erro na requisição');
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na API:', error);
      
      if (error.message && (error.message.includes('Token expirado') || error.message.includes('Token inválido'))) {
        this.logout();
      }
      
      throw error;
    }
  }

  async register(userData) {
    console.log('📝 Registrando usuário...');
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      console.log('🔑 Token recebido no registro, salvando...');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } else {
      console.log('⚠️ Nenhum token recebido na resposta do registro');
    }

    return response;
  }

  async login(credentials) {
    console.log('🔐 Fazendo login...');
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      console.log('🔑 Token recebido no login, salvando...');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } else {
      console.log('⚠️ Nenhum token recebido na resposta do login');
    }

    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    console.log('🔄 Atualizando perfil...');
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify-token', {
      method: 'POST',
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, passwordData) {
    console.log('🔐 Reset password called with token:', token);
    console.log('🔐 Will make request to:', `${this.baseURL}/auth/reset-password/${token}`);
    
    return this.request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async requestAccountDeletion() {
    console.log('🗑️ Solicitando exclusão de conta...');
    return this.request('/auth/request-account-deletion', {
      method: 'POST',
    });
  }

  async confirmAccountDeletion(token) {
    console.log('🗑️ Confirmando exclusão de conta com token:', token);
    console.log('🗑️ Will make request to:', `${this.baseURL}/auth/confirm-account-deletion/${token}`);
    
    return this.request(`/auth/confirm-account-deletion/${token}`, {
      method: 'POST',
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users?${query}`);
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserStats() {
    return this.request('/users/stats/overview');
  }

  async setupProfile(profileData) {
    return this.request('/users/profile-setup', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async skipProfileSetup() {
    return this.request('/users/profile-setup/skip', {
      method: 'POST',
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();
