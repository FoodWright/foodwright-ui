import { defineStore } from 'pinia';
import { getIdToken } from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Holds { uid, email, displayName, photoURL }
    token: null, // Holds the Firebase JWT token
    isAdmin: false,
    favoriteRecipeIds: [], // <-- NEW: Holds an array of recipe IDs [1, 4, 12]
  }),

  actions: {
    async setUser(firebaseUser) {
      if (firebaseUser) {
        // User is logged in
        const idToken = await getIdToken(firebaseUser, /* forceRefresh */ true);
        this.token = idToken;
        this.user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
      } else {
        // User is logged out
        this.user = null;
        this.token = null;
        this.isAdmin = false;
        this.favoriteRecipeIds = []; // <-- NEW: Clear on logout
      }
    },
    setAdminStatus(isAdmin) {
      this.isAdmin = !!isAdmin;
    },

    // --- NEW ACTIONS for Favorites ---
    setFavoriteIds(ids) {
      this.favoriteRecipeIds = ids;
    },
    addFavoriteId(id) {
      if (!this.favoriteRecipeIds.includes(id)) {
        this.favoriteRecipeIds.push(id);
      }
    },
    removeFavoriteId(id) {
      this.favoriteRecipeIds = this.favoriteRecipeIds.filter(favId => favId !== id);
    },
  },

  // This enables persistence for the entire store
  persist: true,
});
