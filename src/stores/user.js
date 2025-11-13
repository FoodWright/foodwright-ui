import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { fetchWithAuth, fetchPublic } from 'src/services/api';

// const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';


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
