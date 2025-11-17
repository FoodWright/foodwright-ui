import { defineStore } from 'pinia';
// --- MODIFIED IMPORTS ---
import { useAuthStore } from './auth';
import { fetchWithAuth, fetchPublic } from 'src/services/api';
// ---

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    pendingRecipes: [],
    recipes: [],
    recipe: null,
    recipeToEdit: null,
    tags: [],
    favorites: [],
    privateRecipes: [],
    submissions: [],
    cookLogs: [],
    comments: [],
    featuredRecipes: [],
  }),
  actions: {
    async fetchPendingRecipes() {
      const data = await fetchWithAuth('/admin/pending-recipes');
      this.pendingRecipes = data || [];
      return this.pendingRecipes;
    },
    // --- MODIFIED: Send XP value ---
    async approveRecipe(id, xp) {
      await fetchWithAuth(`/admin/recipes/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ xp: xp || 10 }), // Send the XP in the body
      });
      this.pendingRecipes = this.pendingRecipes.filter((r) => r.id !== id);
    },
    // ---
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
        await fetchWithAuth(`/recipes/${recipeId}/favorite`, {
          method: 'DELETE',
        });
        this.favorites = this.favorites.filter((r) => r.id !== recipeId);
      } else {
        authStore.addFavoriteId(recipeId);
        await fetchWithAuth(`/recipes/${recipeId}/favorite`, { method: 'POST' });
        // Optionally re-fetch or add to favorites list
      }
    },
    async deletePrivateRecipe(recipeId) {
      await fetchWithAuth(`/recipes/private/${recipeId}`, { method: 'DELETE' });
      this.privateRecipes = this.privateRecipes.filter((r) => r.id !== recipeId);
    },

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

    async fetchFeaturedRecipes() {
      const data = await fetchPublic('/recipes/featured');
      this.featuredRecipes = data || [];
      return this.featuredRecipes;
    },

    async fetchRecipe(id) {
      const authStore = useAuthStore();
      let data;
      // Use public fetch if not logged in
      if (authStore.user) {
        data = await fetchWithAuth(`/recipes/${id}`);
      } else {
        data = await fetchPublic(`/recipes/${id}`);
      }
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
      // Refresh both logs and main recipe (for ratings)
      await Promise.all([this.fetchCookLogs(id), this.fetchRecipe(id)]);
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

    setRecipeToEdit(recipe) {
      this.recipeToEdit = recipe;
    },

    async importRecipeFromUrl(url) { // <-- ADD THIS ACTION
      const data = await fetchWithAuth('/recipes/import-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      return data; // This is the partial recipe object from the backend
    },
  },
});
