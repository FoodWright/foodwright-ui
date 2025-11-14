<template>
  <!-- === NEW: Add QLayout wrapper === -->
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <!-- === MODIFIED: QPage is now inside container === -->
      <q-page class="window-height window-width row justify-center items-center"
        style="background: linear-gradient(#f2f2f2, #e6e6e6)">
        <div class="col-xs-12 col-sm-8 col-md-6 col-lg-4 q-pa-md">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h4 text-center text-primary q-mb-md">
                Foodwright Guild
              </div>
              <q-tabs v-model="tab" dense align="justify" active-color="primary">
                <q-tab name="login" label="Login" />
                <q-tab name="signup" label="Sign Up" />
              </q-tabs>

              <q-separator class="q-mb-lg" />

              <q-tab-panels v-model="tab" animated>
                <!-- Login Panel -->
                <q-tab-panel name="login">
                  <q-form @submit.prevent="handleLogin" class="q-gutter-md">
                    <q-input v-model="loginForm.email" label="Email" type="email" outlined dense
                      :rules="[(val) => !!val || 'Email is required']" />
                    <q-input v-model="loginForm.password" label="Password" type="password" outlined dense
                      :rules="[(val) => !!val || 'Password is required']" />
                    <q-btn label="Login" type="submit" color="primary" class="full-width" :loading="loading" />
                  </q-form>

                  <q-separator class="q-my-md" text-color="primary">OR</q-separator>

                  <q-btn label="Login with Google" @click="handleGoogleLogin" color="red" icon="fab fa-google"
                    class="full-width" :loading="loading" />
                </q-tab-panel>

                <!-- Sign Up Panel -->
                <q-tab-panel name="signup">
                  <q-form @submit.prevent="handleSignup" class="q-gutter-md">
                    <q-input v-model="signupForm.username" label="Guild Name (Username)" outlined dense :rules="[
                      (val) => !!val || 'Username is required',
                      (val) =>
                        val.length >= 3 || 'Must be at least 3 characters',
                    ]" />
                    <q-input v-model="signupForm.email" label="Email" type="email" outlined dense
                      :rules="[(val) => !!val || 'Email is required']" />
                    <q-input v-model="signupForm.password" label="Password" type="password" outlined dense :rules="[
                      (val) => !!val || 'Password is required',
                      (val) =>
                        val.length >= 6 || 'Must be at least 6 characters',
                    ]" />
                    <q-btn label="Create Account" type="submit" color="primary" class="full-width" :loading="loading" />
                  </q-form>

                  <q-separator class="q-my-md" text-color="primary">OR</q-separator>

                  <q-btn label="Sign Up with Google" @click="handleGoogleLogin" color="red" icon="fab fa-google"
                    class="full-width" :loading="loading" />
                </q-tab-panel>
              </q-tab-panels>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
      <!-- === END MODIFICATION === -->
    </q-page-container>
  </q-layout>
  <!-- === END NEW === -->
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'; // <-- ADD getCurrentInstance
// import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { getIdToken } from 'firebase/auth'; // <-- 1. IMPORT getIdToken

const tab = ref('login');
// const authStore = useAuthStore(); // <-- 2. REMOVE unused variable
const $q = useQuasar();
const router = useRouter();
// --- START: MODIFICATION ---
const { proxy } = getCurrentInstance(); // <-- GET COMPONENT PROXY
const { $firebaseAuth, $auth, $googleProvider } = proxy; // <-- GET GLOBAL PROPERTIES
// --- END: MODIFICATION ---

const loading = ref(false);

const loginForm = reactive({
  email: '',
  password: '',
});

const signupForm = reactive({
  username: '',
  email: '',
  password: '',
});

const handleLogin = async () => {
  loading.value = true;
  try {
    // --- MODIFIED: Call Firebase auth directly ---
    await $auth.signInWithEmailAndPassword(
      $firebaseAuth,
      loginForm.email,
      loginForm.password
    );
    // onAuthStateChanged will handle the rest
    // ---
    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: 'Logged in successfully!',
    });
    router.push('/');
  } catch (err) {
    handleAuthError(err);
  } finally {
    loading.value = false;
  }
};

const handleSignup = async () => {
  loading.value = true;
  try {
    // --- MODIFIED: Call Firebase auth directly ---
    const userCredential = await $auth.createUserWithEmailAndPassword(
      $firebaseAuth,
      signupForm.email,
      signupForm.password
    );
    // 2. Set their display name
    if (userCredential.user) {
      await $auth.updateProfile(userCredential.user, {
        displayName: signupForm.username,
      });
      // 3. Force-refresh token to get displayName in claims
      // This will be picked up by onAuthStateChanged
      await getIdToken(userCredential.user, true);
    }
    // onAuthStateChanged will handle the rest
    // ---
    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: 'Account created! Welcome!',
    });
    router.push('/');
  } catch (err) {
    handleAuthError(err);
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  loading.value = true;
  try {
    // --- MODIFIED: Call Firebase auth directly ---
    await $auth.signInWithPopup($firebaseAuth, $googleProvider);
    // onAuthStateChanged will handle the rest
    // ---
    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: 'Logged in successfully!',
    });
    router.push('/');
  } catch (err) {
    handleAuthError(err);
  } finally {
    loading.value = false;
  }
};

const handleAuthError = (err) => {
  let message = 'An unknown error occurred.';
  if (err.code) {
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Invalid email or password.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        message = 'The password is too weak (must be 6+ characters).';
        break;
      case 'auth/invalid-email':
        message = 'The email address is not valid.';
        break;
      default:
        message = err.message;
    }
  }
  $q.notify({
    color: 'negative',
    icon: 'error',
    message: message,
  });
};
</script>
