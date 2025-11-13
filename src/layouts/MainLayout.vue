<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-btn flat dense no-caps to="/" class="text-h6">Food Wright</q-btn>
        </q-toolbar-title>

        <!-- --- User Links (Desktop Only) --- -->
        <!-- These hide on 'xs' screens -->
        <div v-if="authStore.user" class="q-gutter-sm gt-xs">
          <q-btn flat dense to="/my-cookbook" label="My Cookbook" icon="book" />
          <q-btn flat dense to="/submit" label="Submit Recipe" icon="add_circle_outline" />
        </div>

        <q-space />

        <!-- --- Login Button (Logged Out) --- -->
        <q-btn v-if="!authStore.user" flat @click="login" label="Login with Google" />

        <!-- --- NEW: Unified User Menu (Logged In) --- -->
        <div v-if="authStore.user">
          <q-btn flat dense no-caps class="q-ml-md">
            <!-- Avatar -->
            <q-avatar size="32px">
              <img :src="authStore.user.photoURL" alt="User avatar" />
            </q-avatar>
            <!-- Desktop-only Name -->
            <div class="q-ml-sm gt-xs">{{ authStore.user.displayName }}</div>
            <!-- Dropdown Arrow -->
            <q-icon name="arrow_drop_down" class="q-ml-xs" />

            <!-- --- Dropdown Menu --- -->
            <q-menu auto-close>
              <q-list style="min-width: 220px">
                <!-- Profile Link -->
                <q-item clickable :to="`/user/${authStore.user.uid}`">
                  <q-item-section avatar><q-icon name="person" /></q-item-section>
                  <q-item-section>My Profile</q-item-section>
                </q-item>

                <q-separator />

                <!-- Mobile-Only Links (re-appear here) -->
                <!-- These hide on 'sm' and larger screens -->
                <q-item clickable to="/my-cookbook" class="lt-sm">
                  <q-item-section avatar><q-icon name="book" /></q-item-section>
                  <q-item-section>My Cookbook</q-item-section>
                </q-item>
                <q-item clickable to="/submit" class="lt-sm">
                  <q-item-section avatar><q-icon name="add_circle_outline" /></q-item-section>
                  <q-item-section>Submit Recipe</q-item-section>
                </q-item>

                <!-- All-Sizes Links -->
                <q-item clickable to="/my-submissions">
                  <q-item-section avatar><q-icon name="playlist_add_check" /></q-item-section>
                  <q-item-section>My Submissions</q-item-section>
                </q-item>

                <!-- Admin Links -->
                <div v-if="authStore.isAdmin || authStore.isSiteAdmin">
                  <q-separator />
                  <q-item-label header>Admin</q-item-label>
                  <q-item v-if="authStore.isAdmin" clickable to="/admin">
                    <q-item-section avatar><q-icon name="admin_panel_settings" color="amber-8" /></q-item-section>
                    <q-item-section>Guild Admin</q-item-section>
                  </q-item>
                  <q-item v-if="authStore.isSiteAdmin" clickable to="/site-admin">
                    <q-item-section avatar><q-icon name="construction" color="red-8" /></q-item-section>
                    <q-item-section>Site Admin</q-item-section>
                  </q-item>
                </div>

                <q-separator />

                <!-- Logout Button -->
                <q-item clickable @click="logout">
                  <q-item-section avatar><q-icon name="logout" /></q-item-section>
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
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
