import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { useAuthStore } from 'stores/auth'; // Assumes `stores` is aliased in jsconfig.json/quasar.config.js

// !! IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
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
})

// This boot file runs once
export default boot(({ app, store }) => {
  const authStore = useAuthStore(store);

  // Set up the onAuthStateChanged listener
  // This runs when the app loads and any time the auth state changes
  onAuthStateChanged(firebaseAuth, (user) => {
    console.log('Firebase auth state changed, user:', user?.uid || 'null');
    // Use the Pinia store to set the user
    // This will automatically fetch and store the token
    authStore.setUser(user);
  });

  // Inject Firebase services into all Vue components
  // for easy access via `this.$firebaseAuth` (Options API)
  // or `proxy.$firebaseAuth` (Composition API)
  app.config.globalProperties.$firebaseAuth = firebaseAuth;
  app.config.globalProperties.$googleProvider = googleProvider;
  app.config.globalProperties.$firebaseStorage = firebaseStorage;
});
