import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';

const fetchWithAuth = async (endpoint, options = {}) => {
  const authStore = useAuthStore();
  const token = authStore.token;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  if (response.status === 204) return null;
  return response.json();
};

const fetchPublic = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  return response.json();
};

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    logs: [],
  }),
  actions: {
    async fetchProfileAndFavorites() {
      const authStore = useAuthStore();
      if (!authStore.user) return;
      try {
        const profile = await fetchWithAuth('/profile');
        this.profile = profile;
        authStore.setAdminStatus(profile.is_admin);
        authStore.setSiteAdminStatus(profile.is_site_admin);

        const favoriteIds = await fetchWithAuth('/my-favorite-ids');
        authStore.setFavoriteIds(favoriteIds || []);
        return this.profile;
      } catch (error) {
        console.error('Failed to fetch profile/favorites:', error);
        throw error;
      }
    },
    async fetchPublicProfile(id) {
      const data = await fetchPublic(`/profile/${id}`);
      this.profile = data;
      return data;
    },
    async fetchUserLogs(id) {
      const data = await fetchPublic(`/profile/${id}/logs`);
      this.logs = data || [];
      return data;
    },
  },
});
