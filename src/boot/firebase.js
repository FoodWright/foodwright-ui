import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged, // Keep this for token refreshes
  getIdToken,
  // --- NEW IMPORTS ---
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  // ---
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { useAuthStore } from 'stores/auth';

// ... (firebaseConfig remains the same) ...
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firebaseStorage = getStorage(firebaseApp);
const googleProvider = new GoogleAuthProvider();

if (location.hostname === 'localhost') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = false;
}

initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITEKEY),
});

export default boot(({ app, store }) => {
  // <-- Add router
  const authStore = useAuthStore(store);

  // This handles INITIAL LOAD, LOGIN, and LOGOUT
  onAuthStateChanged(firebaseAuth, async (user) => {
    console.log('Firebase auth state changed, user:', user?.uid || 'null');
    await authStore.setUser(user);
    authStore.setAuthReady();
  });

  // This handles automatic TOKEN REFRESHES in the background
  onIdTokenChanged(firebaseAuth, async (user) => {
    if (user) {
      // User is still logged in, but token has refreshed
      console.log('Firebase ID token refreshed.');
      const idToken = await getIdToken(user); // Get the new token
      authStore.setToken(idToken); // Silently update the token in Pinia
    }
  });

  // Make all Firebase functions available to the app
  // (This is used by the auth store)
  app.config.globalProperties.$firebaseAuth = firebaseAuth;
  app.config.globalProperties.$googleProvider = googleProvider;
  app.config.globalProperties.$firebaseStorage = firebaseStorage;

  // --- NEW: Add auth functions to global properties ---
  app.config.globalProperties.$auth = {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
  };
  // ---
});
