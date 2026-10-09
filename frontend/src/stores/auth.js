import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user_session') || 'null'),
    token: localStorage.getItem('user_access_token') || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userName: (state) => state.user?.fullName || 'Khách hàng',
    userPhone: (state) => state.user?.phone || '',
    userEmail: (state) => state.user?.email || '',
    userIdentifier: (state) => state.user?.phone || state.user?.email || 'Thành viên',
    userAvatar: (state) => state.user?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  actions: {
    setUserSession(userData, token) {
      this.user = userData;
      this.token = token;
      api.setToken(token);
      localStorage.setItem('user_session', JSON.stringify(userData));
      if (token) localStorage.setItem('user_access_token', token);
    },
    async logout() {
      await api.logout();
      this.user = null;
      this.token = null;
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_access_token');
    }
  }
});
