<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <!-- Make title a link to home -->
          <q-btn flat dense no-caps to="/" class="text-h6">Foodwright Guild</q-btn>
        </q-toolbar-title>

        <!-- --- User Links --- -->
        <div v-if="authStore.user" class="q-gutter-sm">
          <!-- --- NEW COOKBOOK LINK --- -->
          <q-btn flat dense to="/my-cookbook" label="My Cookbook" icon="book" />
          <q-btn flat dense to="/submit" label="Submit Recipe" />
          <q-btn flat dense to="/my-submissions" label="My Submissions" />

          <q-btn v-if="authStore.isAdmin" flat dense to="/admin" label="Admin" icon="admin_panel_settings"
            color="yellow" />
        </div>

        <!-- Spacer -->
        <q-space />

        <!-- Show Login button if user is not logged in -->
        <q-btn v-if="!authStore.user" flat @click="login" label="Login with Google" />

        <!-- Show user info and Logout button if logged in -->
        <div v-if="authStore.user" class="row items-center q-gutter-md">
          <q-avatar size="32px">
            <img :src="authStore.user.photoURL" alt="User avatar" />
          </q-avatar>
          <div class="gt-xs">{{ authStore.user.displayName }}</div>
          <q-btn flat @click="logout" label="Logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthStore } from 'stores/auth';

const $q = useQuasar();
const authStore = useAuthStore();

const { proxy } = getCurrentInstance();
const $firebaseAuth = proxy.$firebaseAuth;
const $googleProvider = proxy.$googleProvider;

const login = async () => {
  try {
    await signInWithPopup($firebaseAuth, $googleProvider);
    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: 'Logged in successfully!',
    });
  } catch (err) {
    console.error('Login failed:', err);
    $q.notify({
      color: 'negative',
      icon: 'error',
      message: 'Login failed. Please try again.',
    });
  }
};

const logout = async () => {
  try {
    await signOut($firebaseAuth);
    $q.notify({
      color: 'primary',
      icon: 'info',
      message: 'Logged out.',
    });
  } catch (err) {
    console.error('Logout failed:', err);
  }
};
</script>

<style>
/* ... existing styles ... */
body,
.q-layout,
.q-toolbar__title,
.q-btn,
.q-card {
  font-family: 'Inter', sans-serif;
}

.text-h6 {
  font-weight: 600;
}
</style>
