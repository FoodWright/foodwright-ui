<template>
  <q-page class="q-pa-md">
    <!-- ... existing welcome message ... -->
    <div v-if="!authStore.user" class="text-center q-mb-md">
      <h5 class="text-h5 q-mb-sm">Welcome, Novice!</h5>
      <p class="text-body1 text-grey-8">
        Login to join the Guild and start logging your craft.
      </p>
    </div>

    <!-- Main Content Area -->
    <div class="row q-col-gutter-md">
      <!-- Left Column: Recipes -->
      <div class="col-12 col-md-8">
        <!-- ... existing header, loading, error ... -->
        <div class="row items-center justify-between q-mb-md">
          <h6 class="text-h6 q-m-none">Available Recipes</h6>
          <q-btn color="primary" @click="fetchRecipes" :loading="loading" label="Fetch Recipes" />
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner-dots color="primary" size="3em" />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="q-pa-md">
          <q-banner rounded class="bg-red-1 text-red-8">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            <strong>Error fetching data:</strong> {{ error }}
          </q-banner>
        </div>

        <!-- Recipe List -->
        <div v-if="recipes.length > 0" class="row q-col-gutter-md">
          <div v-for="recipe in recipes" :key="recipe.id" class="col-12 col-sm-6">
            <!-- UPDATED: Wrap q-card in a <router-link> -->
            <router-link :to="`/recipe/${recipe.id}`" class="recipe-link">
              <q-card class="recipe-card full-height" flat bordered>
                <q-card-section>
                  <div class="row justify-between no-wrap">
                    <div class="text-h6">{{ recipe.title }}</div>
                    <q-chip color="accent" text-color="white" :label="recipe.xp + ' XP'" />
                  </div>
                  <p class="text-grey-8">{{ recipe.description }}</p>
                  <!-- Show tags -->
                  <div class="q-mt-sm q-gutter-xs">
                    <q-chip v-for="tag in recipe.tags" :key="tag" outline size="sm" color="grey-7" :label="tag" />
                  </div>
                </q-card-section>

                <!-- REMOVED <q-card-actions> with "I Made This!" button -->

              </q-card>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Right Column: Profile (only show if logged in) -->
      <div class="col-12 col-md-4" v-if="authStore.user">
        <!-- ... existing guild card content ... -->
        <h6 class="text-h6 q-mb-md">Your Guild Card</h6>
        <q-card class="bg-grey-2" flat>
          <!-- ... existing card section ... -->
          <q-card-section class="text-center">
            <q-avatar size="80px" class="q-mb-md">
              <img :src="authStore.user.photoURL" />
            </q-avatar>
            <div class="text-h6">{{ authStore.user.displayName }}</div>
            <div class="text-subtitle1 text-grey-8">
              {{ authStore.user.email }}
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-overline text-grey-7">Profile from API:</div>
            <q-btn color="secondary" @click="fetchProfile" :loading="profileLoading" label="Refresh My Guild Profile"
              class="full-width" />

            <div v-if="profileError" class="q-mt-md text-red">
              Error: {{ profileError }}
            </div>

            <!-- Show API Profile Data -->
            <div v-if="guildProfile" class="q-mt-md">
              <q-list dense>
                <!-- ... existing rank item ... -->
                <q-item>
                  <q-item-section avatar><q-icon name="badge" /></q-item-section>
                  <q-item-section>
                    <q-item-label overline>Rank</q-item-label>
                    <q-item-label class="text-weight-bold">{{
                      guildProfile.rank
                      }}</q-item-label>
                  </q-item-section>
                </q-item>
                <!-- ... existing xp item ... -->
                <q-item>
                  <q-item-section avatar><q-icon name="trending_up" /></q-item-section>
                  <q-item-section>
                    <q-item-label overline>XP</q-item-label>
                    <q-item-label class="text-weight-bold">{{
                      guildProfile.xp
                      }}</q-item-label>
                  </q-item-section>
                </q-item>
                <!-- ... existing badge item ... -->
                <q-item>
                  <q-item-section avatar><q-icon name="military_tech" /></q-item-section>
                  <q-item-section>
                    <q-item-label overline>Badges</q-item-label>
                    <!-- This will now work, reading the 'badges' array -->
                    <q-item-label v-if="guildProfile.badges && guildProfile.badges.length">
                      <q-chip v-for="badge in guildProfile.badges" :key="badge" color="secondary" text-color="white"
                        size="sm" :label="badge" />
                    </q-item-label>
                    <q-item-label v-else class="text-caption text-grey-7">No badges yet.</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from 'stores/auth';
// import { useQuasar } from 'quasar';

const authStore = useAuthStore();
// const $q = useQuasar();

// --- API Config ---
const API_URL = 'http://localhost:8080/api';

// --- Refs for API data ---
const recipes = ref([]);
const loading = ref(false);
const error = ref(null);

const guildProfile = ref(null);
const profileLoading = ref(false);
const profileError = ref(null);


// --- API Fetch Helper ---
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = authStore.token;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  return response.json();
};


// --- API Call Functions ---
const fetchRecipes = async () => {
  loading.value = true;
  error.value = null;
  recipes.value = [];
  try {
    const data = await fetchWithAuth('/recipes');
    recipes.value = data;
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const fetchProfile = async () => {
  profileLoading.value = true;
  profileError.value = null;

  if (!authStore.token) {
    profileError.value = 'You must be logged in to fetch your profile.';
    profileLoading.value = false;
    return;
  }

  try {
    const data = await fetchWithAuth('/profile');
    guildProfile.value = data;
    // --- THIS IS THE NEW LINE ---
    // Update the global auth store with the user's admin status
    authStore.setAdminStatus(data.is_admin);
  } catch (err) {
    profileError.value = err.message;
    console.error(err);
  } finally {
    profileLoading.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchRecipes();
  if (authStore.user) {
    console.log('User already logged in on mount, fetching profile.');
    fetchProfile();
  }
});

// --- Watcher ---
watch(
  () => authStore.user,
  (newUser, oldUser) => {
    if (newUser && !oldUser) {
      console.log('User just logged in (detected by watch), fetching profile.');
      fetchProfile();
    } else if (!newUser && oldUser) {
      console.log('User just logged out (detected by watch), clearing profile.');
      guildProfile.value = null;
      profileError.value = null;
      authStore.setAdminStatus(false); // <-- NEW: Clear admin status on logout
    }
  }
);
</script>

<style scoped>
/* ... existing styles ... */
.recipe-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  /* Make card fill the router-link wrapper */
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.recipe-link {
  text-decoration: none;
  color: inherit;
  /* Inherit text color from parent */
  display: block;
  height: 100%;
}
</style>
