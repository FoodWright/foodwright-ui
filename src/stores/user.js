import { defineStore } from 'pinia';
// --- MODIFIED IMPORTS ---
import { useAuthStore } from './auth';
import { fetchWithAuth, fetchPublic } from 'src/services/api';
// ---

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null, // This state is ONLY for the LOGGED-IN user
    // logs: [], // This is now local state in UserProfilePage.vue
  }),
  actions: {
    /**
     * Fetches the LOGGED-IN user's full profile and favorites.
     * This is the only action that should write to `this.profile`.
     */
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
    /**
     * Fetches a PUBLIC profile by ID.
     * Does NOT write to state.
     */
    async fetchPublicProfile(id) {
      const data = await fetchPublic(`/profile/${id}`);
      return data;
    },
    /**
     * Fetches a user's PUBLIC logs by ID.
     * Does NOT write to state.
     */
    async fetchUserLogs(id) {
      const data = await fetchPublic(`/profile/${id}/logs`);
      return data || [];
    },
    /**
     * Updates the logged-in user's preferences.
     */
    async updatePreferences(prefs) {
      const data = await fetchWithAuth('/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });

      // Optimistically update the local profile
      if (this.profile && data.unit_preference) {
        this.profile.unit_preference = data.unit_preference;
      }
    },
  },
});
