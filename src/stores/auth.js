import { defineStore } from 'pinia';
import { getIdToken } from 'firebase/auth';
// --- DELETED ---
// import { getCurrentInstance } from 'vue';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Holds { uid, email, displayName, photoURL }
    token: null, // Holds the Firebase JWT token
    isAdmin: false,
    isSiteAdmin: false,
    favoriteRecipeIds: [],
    authReady: false, // <-- Flag to signal auth is ready
  }),

  actions: {
    async setUser(firebaseUser) {
      if (firebaseUser) {
        // User is logged in
        const idToken = await getIdToken(firebaseUser);
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
        this.isSiteAdmin = false;
        this.favoriteRecipeIds = [];
      }
    },

    setToken(token) {
      this.token = token;
    },

    setAuthReady() {
      this.authReady = true;
    },

    setAdminStatus(isAdmin) {
      this.isAdmin = !!isAdmin;
    },
    setSiteAdminStatus(isSiteAdmin) {
      this.isSiteAdmin = !!isSiteAdmin;
    },
    setFavoriteIds(ids) {
      this.favoriteRecipeIds = ids;
    },
    addFavoriteId(id) {
      if (!this.favoriteRecipeIds.includes(id)) {
        this.favoriteRecipeIds.push(id);
      }
    },
    removeFavoriteId(id) {
      this.favoriteRecipeIds = this.favoriteRecipeIds.filter(
        (favId) => favId !== id
      );
    },

    // --- DELETED AUTH ACTIONS (loginWithEmail, signupWithEmail, loginWithGoogle) ---
    // These will be called from the component context (LoginPage.vue)

    // --- MODIFIED LOGOUT ACTION ---
    // This action is now only responsible for clearing the Pinia state.
    // The actual Firebase sign-out is called from MainLayout.vue
    async clearAuthData() {
      this.user = null;
      this.token = null;
      this.isAdmin = false;
      this.isSiteAdmin = false;
      this.favoriteRecipeIds = [];
      // onAuthStateChanged will handle the rest, but this is a fast clear
    },
    // --- END MODIFIED ACTIONS ---
  },

  persist: true,
});
