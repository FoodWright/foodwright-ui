<template>
  <q-page class="q-pa-md">
    <!-- Welcome message -->
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
        <div class="row items-center justify-between q-mb-md">
          <h6 class="text-h6 q-m-none">Available Recipes</h6>
        </div>

        <!-- Search and Filter -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="searchQuery" label="Search by Title" outlined dense clearable debounce="300">
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-select v-model="selectedTags" :options="availableTags" label="Filter by Tags" outlined dense multiple
                  use-chips clearable />
              </div>
            </div>
          </q-card-section>
        </q-card>

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

        <!-- Empty State for Filters -->
        <div v-if="!loading && filteredRecipes.length === 0" class="text-center q-pa-xl text-grey-7">
          <q-icon name="manage_search" size="3em" class="q-mb-sm" />
          <div class="text-h6">No recipes found.</div>
          <p>Try adjusting your search or filters.</p>
        </div>

        <!-- Recipe List -->
        <div v-else class="row q-col-gutter-md">
          <div v-for="recipe in filteredRecipes" :key="recipe.id" class="col-12 col-sm-6">
            <!-- Card is wrapped in router-link -->
            <q-card class="recipe-card full-height" flat bordered>
              <!-- Favorite Button -->
              <q-btn v-if="authStore.user && favoritesLoaded" flat round
                :color="isFavorited(recipe.id) ? 'primary' : 'grey'" :icon="isFavorited(recipe.id) ? 'bookmark' : 'bookmark_border'
                  " @click.prevent="toggleFavorite(recipe.id)" class="absolute-top-right q-ma-xs" style="z-index: 1" />

              <router-link :to="`/recipe/${recipe.id}`" class="recipe-link">
                <q-card-section>
                  <!-- Added q-pr-xl to this div to make room for the button -->
                  <div class="row justify-between no-wrap q-pr-xl">
                    <!-- Added ellipsis to handle long titles -->
                    <div class="text-h6 q-pr-lg ellipsis">
                      {{ recipe.title }}
                    </div>
                    <q-chip color="accent" text-color="white" :label="recipe.xp + ' XP'" />
                  </div>
                  <!-- ============================ -->
                  <p class="text-grey-8 ellipsis-3-lines q-mt-sm">
                    {{ recipe.description }}
                  </p>
                  <div class="q-mt-sm q-gutter-xs">
                    <q-chip v-for="tag in recipe.tags" :key="tag" outline size="sm" color="grey-7" :label="tag" />
                  </div>
                </q-card-section>
              </router-link>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Right Column: Profile -->
      <div class="col-12 col-md-4" v-if="authStore.user">
        <h6 class="text-h6 q-mb-md">Your Guild Card</h6>
        <q-card class="bg-grey-2" flat>
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
            <q-btn color="secondary" @click="fetchProfileAndFavorites" :loading="profileLoading"
              label="Refresh My Guild Profile" class="full-width" />

            <div v-if="profileError" class="q-mt-md text-red">
              Error: {{ profileError }}
            </div>

            <!-- Show API Profile Data -->
            <div v-if="guildProfile" class="q-mt-md">
              <q-list dense>
                <q-item>
                  <q-item-section avatar><q-icon name="badge" /></q-item-section>
                  <q-item-section>
                    <q-item-label overline>Rank</q-item-label>
                    <q-item-label class="text-weight-bold">{{
                      guildProfile.rank
                      }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="trending_up" /></q-item-section>
                  <q-item-section>
                    <q-item-label overline>XP</q-item-label>
                    <q-item-label class="text-weight-bold">{{
                      guildProfile.xp
                      }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="military_tech" /></q-item-section>
                  <q-item-section>
                    <q-item-label overline>Badges</q-item-label>
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
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const $q = useQuasar();

// --- API Config ---
const API_URL = 'http://localhost:8080/api';

// --- Refs for API data ---
const recipes = ref([]);
const loading = ref(false);
const error = ref(null);

const guildProfile = ref(null);
const profileLoading = ref(false);
const profileError = ref(null);
const favoritesLoaded = ref(false); // <-- Fix for race condition

// --- Refs for filtering ---
const searchQuery = ref('');
const selectedTags = ref([]);

// --- Computed property for available tags ---
const availableTags = computed(() => {
  const allTags = new Set();
  recipes.value.forEach((recipe) => {
    if (recipe.tags) {
      recipe.tags.forEach((tag) => allTags.add(tag));
    }
  });
  return Array.from(allTags).sort();
});

// --- Computed property for filtered recipes ---
const filteredRecipes = computed(() => {
  let filtered = recipes.value;
  if (searchQuery.value) {
    const lowerQuery = searchQuery.value.toLowerCase();
    filtered = filtered.filter((recipe) =>
      recipe.title.toLowerCase().includes(lowerQuery)
    );
  }
  if (selectedTags.value && selectedTags.value.length > 0) {
    filtered = filtered.filter((recipe) => {
      if (!recipe.tags || recipe.tags.length === 0) return false;
      return selectedTags.value.every((tag) => recipe.tags.includes(tag));
    });
  }
  return filtered;
});

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
  if (
    response.status === 200 &&
    response.headers.get('content-length') === '0'
  ) {
    return null;
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
    recipes.value = data || []; // Ensure it's an array
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const fetchProfileAndFavorites = async () => {
  if (!authStore.user) return;
  profileLoading.value = true;
  profileError.value = null;
  favoritesLoaded.value = false;
  try {
    const [profileData, favoriteIds] = await Promise.all([
      fetchWithAuth('/profile'),
      fetchWithAuth('/my-favorite-ids'),
    ]);

    guildProfile.value = profileData;
    authStore.setAdminStatus(profileData.is_admin);
    authStore.setFavoriteIds(favoriteIds || []); // Ensure it's an array
    favoritesLoaded.value = true;
  } catch (err) {
    profileError.value = err.message;
    console.error(err);
  } finally {
    profileLoading.value = false;
  }
};

// --- NEW: Favorite Functions ---
const isFavorited = (recipeId) => {
  if (!Array.isArray(authStore.favoriteRecipeIds)) {
    return false;
  }
  return authStore.favoriteRecipeIds.includes(recipeId);
};

const toggleFavorite = async (recipeId) => {
  if (!authStore.user) {
    $q.notify({
      color: 'negative',
      message: 'You must be logged in to save recipes.',
    });
    return;
  }

  const alreadyFavorited = isFavorited(recipeId);
  try {
    if (alreadyFavorited) {
      authStore.removeFavoriteId(recipeId);
      await fetchWithAuth(`/recipes/${recipeId}/favorite`, {
        method: 'DELETE',
      });
      $q.notify({
        color: 'primary',
        message: 'Removed from cookbook',
        icon: 'bookmark_remove',
      });
    } else {
      authStore.addFavoriteId(recipeId);
      await fetchWithAuth(`/recipes/${recipeId}/favorite`, { method: 'POST' });
      $q.notify({
        color: 'positive',
        message: 'Added to cookbook!',
        icon: 'bookmark_add',
      });
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to update cookbook: ${err.message}`,
    });
    if (alreadyFavorited) {
      authStore.addFavoriteId(recipeId);
    } else {
      authStore.removeFavoriteId(recipeId);
    }
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchRecipes();
  if (authStore.user) {
    console.log('User already logged in on mount, fetching profile & faves.');
    fetchProfileAndFavorites();
  }
});

// --- Watcher (Updated) ---
watch(
  () => authStore.user,
  (newUser, oldUser) => {
    if (newUser && !oldUser) {
      console.log(
        'User just logged in (detected by watch), fetching profile & faves.'
      );
      fetchProfileAndFavorites();
    } else if (!newUser && oldUser) {
      console.log('User just logged out (detected by watch), clearing profile.');
      guildProfile.value = null;
      profileError.value = null;
      favoritesLoaded.value = false;
      authStore.setAdminStatus(false);
      authStore.setFavoriteIds([]);
    }
  }
);
</script>

<style scoped>
.recipe-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.recipe-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
  position: relative;
}

.ellipsis-3-lines {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* New ellipsis for single-line title */
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
