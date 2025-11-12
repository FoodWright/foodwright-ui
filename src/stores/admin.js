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

export const useAdminStore = defineStore('admin', {
  state: () => ({
    badges: [],
  }),
  actions: {
    async fetchBadges() {
      const data = await fetchWithAuth('/site-admin/badges');
      this.badges = data.map(b => ({
        ...b,
        icon_url: b.icon_url.Valid ? b.icon_url.String : ''
      })) || [];
      return this.badges;
    },
    async saveBadge(payload) {
      if (payload.id) {
        // Update
        await fetchWithAuth(`/site-admin/badges/${payload.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        await fetchWithAuth('/site-admin/badges', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await this.fetchBadges();
    },
  },
});
