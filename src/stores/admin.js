import { defineStore } from 'pinia';
import { useRecipeStore } from './recipes';
import { fetchWithAuth } from 'src/services/api';

// const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';

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
    async toggleRecipeFeature(recipeId) {
      const data = await fetchWithAuth(`/site-admin/recipes/${recipeId}/toggle-feature`, {
        method: 'POST',
      });

      // Optimistically update the recipe in the recipeStore
      // This avoids a full page reload
      const recipeStore = useRecipeStore();
      if (recipeStore.recipe && recipeStore.recipe.id === recipeId) {
        recipeStore.recipe.is_featured = data.is_featured;
      }
    },
  },
});
