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

        <!-- --- MODIFIED: Login Button (Logged Out) --- -->
        <q-btn v-if="!authStore.user" flat to="/login" label="Login / Sign Up" />
        <!-- === END MODIFICATION === -->

        <!-- --- NEW: Unified User Menu (Logged In) --- -->
        <div v-if="authStore.user">
          <q-btn flat dense no-caps class="q-ml-md">
            <!-- === MODIFIED: Avatar with Fallback + Referrer Policy === -->
            <q-avatar size="32px" :color="authStore.user.photoURL ? 'white' : 'secondary'"
              :text-color="authStore.user.photoURL ? 'primary' : 'white'">
              <img v-if="authStore.user.photoURL" :src="authStore.user.photoURL" alt="User avatar"
                referrerpolicy="no-referrer" />
              <template v-else>
                {{ userInitials }}
              </template>
            </q-avatar>
            <!-- === END MODIFICATION === -->

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
                  <!-- ... existing code ... -->
                  <q-item-section>My Submissions</q-item-section>
                </q-item>

                <!-- === NEW: Tool Link === -->
                <q-item clickable to="/tools/converter">
                  <q-item-section avatar><q-icon name="calculate" /></q-item-section>
                  <q-item-section>Unit Converter</q-item-section>
                </q-item>
                <!-- === END NEW === -->

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

                <!-- === MODIFIED: Logout Button === -->
                <q-item clickable @click="handleLogout()">
                  <q-item-section avatar><q-icon name="logout" /></q-item-section>
                  <q-item-section>Logout</q-item-section>
                </q-item>
                <!-- === END MODIFICATION === -->
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
import { getCurrentInstance, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useRouter } from 'vue-router'; // <-- IMPORT useRouter

const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter(); // <-- GET ROUTER
// --- START: MODIFICATION ---
const { proxy } = getCurrentInstance(); // <-- GET COMPONENT PROXY
// --- END: MODIFICATION ---

// --- NEW: handleLogout function ---
const handleLogout = async () => {
  // --- START: MODIFICATION ---
  const { $firebaseAuth, $auth } = proxy; // <-- GET GLOBAL PROPERTIES DIRECTLY
  // --- END: MODIFICATION ---
  try {
    await $auth.signOut($firebaseAuth);
    // onAuthStateChanged will fire, but we also clear state
    // and push to login immediately.
    await authStore.clearAuthData();
    router.push('/login');
    $q.notify({
      color: 'primary',
      icon: 'info',
      message: 'Logged out.',
    });
  } catch (err) {
    console.error('Logout failed:', err);
  }
};
// ---

// --- Compute user initials ---
const userInitials = computed(() => {
  const name = authStore.user?.displayName || '';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});
</script>

<style>
/* ... existing styles ... */
</style>
