import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { useAuthStore } from 'stores/auth';
import { getIdToken } from 'firebase/auth';

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

if (location.hostname === "localhost") {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = false;
}

initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITEKEY)
});

export default boot(({ app, store }) => {
  const authStore = useAuthStore(store);

  onAuthStateChanged(firebaseAuth, async (user) => {
    console.log('Firebase auth state changed, user:', user?.uid || 'null');
    // Wait for setUser to complete (which includes fetching the token)
    await authStore.setUser(user);
    // NOW, signal to the rest of the app that auth is ready
    authStore.setAuthReady();
  });

  onIdTokenChanged(firebaseAuth, async (user) => {
    if (user) {
      // User is still logged in, but token has refreshed
      console.log('Firebase ID token refreshed.');
      const idToken = await getIdToken(user); // Get the new token
      authStore.token = idToken; // Silently update the token in Pinia
    }
  });

  app.config.globalProperties.$firebaseAuth = firebaseAuth;
  app.config.globalProperties.$googleProvider = googleProvider;
  app.config.globalProperties.$firebaseStorage = firebaseStorage;
});
