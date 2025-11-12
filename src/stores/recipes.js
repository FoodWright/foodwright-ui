import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_SERVER + '/api' || 'http://localhost:8080/api';

// --- NEW: Public Fetch Helper ---
const fetchPublic = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  if (response.status === 204) return null;
  return response.json();
};
// ---

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

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    pendingRecipes: [],
    recipes: [],
    recipe: null,
    tags: [],
    favorites: [],
    privateRecipes: [],
    submissions: [],
    cookLogs: [],
    comments: [],
    featuredRecipes: [],
  }),
  actions: {
    async fetchFeaturedRecipes() {
      const data = await fetchPublic('/recipes/featured');
      this.featuredRecipes = data || [];
      return this.featuredRecipes;
    },
    async fetchPendingRecipes() {
      const data = await fetchWithAuth('/admin/pending-recipes');
      this.pendingRecipes = data || [];
      return this.pendingRecipes;
    },
    async approveRecipe(id) {
      await fetchWithAuth(`/admin/recipes/${id}/approve`, { method: 'POST' });
      this.pendingRecipes = this.pendingRecipes.filter((r) => r.id !== id);
    },
    async rejectRecipe(id) {
      await fetchWithAuth(`/admin/recipes/${id}/reject`, { method: 'POST' });
      this.pendingRecipes = this.pendingRecipes.filter((r) => r.id !== id);
    },
    async fetchMySubmissions() {
      const data = await fetchWithAuth('/recipes/my-submissions');
      this.submissions = data || [];
      return this.submissions;
    },
    async fetchMyCookbook() {
      const data = await fetchWithAuth('/my-cookbook');
      this.favorites = data || [];
      return this.favorites;
    },
    async fetchMyPrivateRecipes() {
      const data = await fetchWithAuth('/my-private-recipes');
      this.privateRecipes = data || [];
      return this.privateRecipes;
    },
    async toggleFavorite(recipeId) {
      const authStore = useAuthStore();
      const isFavorited = authStore.favoriteRecipeIds.includes(recipeId);
      if (isFavorited) {
        authStore.removeFavoriteId(recipeId);
        await fetchWithAuth(`/recipes/${recipeId}/favorite`, { method: 'DELETE' });
        this.favorites = this.favorites.filter((r) => r.id !== recipeId);
      } else {
        authStore.addFavoriteId(recipeId);
        await fetchWithAuth(`/recipes/${recipeId}/favorite`, { method: 'POST' });
        // Optionally re-fetch or add to favorites list
      }
    },
    async deletePrivateRecipe(recipeId) {
      await fetchWithAuth(`/recipes/private/${recipeId}`, { method: 'DELETE' });
      this.privateRecipes = this.privateRecipes.filter(r => r.id !== recipeId);
    },

    // --- MODIFIED: Use fetchPublic ---
    async fetchRecipes(params) {
      const urlParams = new URLSearchParams(params);
      const data = await fetchPublic(`/recipes?${urlParams.toString()}`);
      this.recipes = data.recipes || [];
      return data;
    },
    async fetchTags() {
      const data = await fetchPublic('/tags'); // <-- MODIFIED
      this.tags = data || [];
      return this.tags;
    },
    // ---

    async fetchRecipe(id) {
      // This uses fetchWithAuth *intentionally* to get user-specific data
      // (like private recipes, favorited status, etc. in the future)
      const data = await fetchWithAuth(`/recipes/${id}`);
      this.recipe = data;
      return data;
    },
    async savePrivateRecipe(payload) {
      if (payload.id) {
        // Update
        return await fetchWithAuth(`/recipes/private/${payload.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        return await fetchWithAuth('/recipes/private', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    async submitToGuild(id) {
      return await fetchWithAuth(`/recipes/private/${id}/submit`, {
        method: 'POST',
      });
    },
    async fetchCookLogs(id) {
      const data = await fetchPublic(`/recipes/${id}/logs`); // <-- MODIFIED
      this.cookLogs = data || [];
      return this.cookLogs;
    },
    async fetchComments(id) {
      const data = await fetchPublic(`/recipes/${id}/comments`); // <-- MODIFIED
      this.comments = data || [];
      return this.comments;
    },
    async logCook(id, payload) {
      const response = await fetchWithAuth(`/recipes/${id}/log`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await this.fetchCookLogs(id);
      return response;
    },
    async postComment(id, comment) {
      const newComment = await fetchWithAuth(`/recipes/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });
      this.comments.unshift(newComment);
      return newComment;
    },
    async submitRecipe(payload) {
      return await fetchWithAuth('/recipes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
});
