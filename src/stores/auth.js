import { defineStore } from 'pinia';
import { getIdToken } from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // Holds { uid, email, displayName, photoURL }
    token: null, // Holds the Firebase JWT token
    isAdmin: false, // <-- NEW: To control admin UI
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
        this.isAdmin = false; // <-- NEW: Reset on logout
      }
    },
    // --- NEW ACTION ---
    // This will be called by IndexPage.vue when the profile is fetched
    setAdminStatus(isAdmin) {
      this.isAdmin = !!isAdmin; // Coerce to boolean
    },
  },

  // This enables persistence for the entire store
  persist: true,
});
