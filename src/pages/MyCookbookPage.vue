<template>
  <q-page class="q-pa-md" style="max-width: 900px; margin: 0 auto">
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-mt-none q-mb-none">My Cookbook</h4>
      <q-btn v-if="tab === 'private'" to="/my-cookbook/private/new" label="Add Private Recipe" color="primary"
        icon="add" />
    </div>

    <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left"
      narrow-indicator>
      <q-tab name="favorites" label="Favorites" />
      <q-tab name="private" label="My Private Recipes" />
    </q-tabs>

    <q-separator class="q-mb-lg" />

    <q-tab-panels v-model="tab" animated>
      <!-- Tab 1: Favorites -->
      <q-tab-panel name="favorites">
        <p class="text-body1 text-grey-8">
          Your collection of saved Guild recipes.
        </p>

        <div v-if="loading.favorites" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="3em" />
        </div>
        <div v-if="error.favorites" class="q-pa-md">
          <q-banner rounded class="bg-red-1 text-red-8">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            <strong>Error fetching your favorites:</strong> {{ error.favorites }}
          </q-banner>
        </div>
        <div v-if="favorites.length === 0 && !loading.favorites" class="text-center q-pa-xl">
          <q-icon name="bookmark_border" size="3em" class="text-grey-5 q-mb-sm" />
          <div class="text-h6 text-grey-7">No favorite recipes yet.</div>
          <p class="q-mt-sm">
            Click the bookmark icon on any recipe to save it here.
          </p>
          <q-btn to="/" label="Find Recipes" color="primary" class="q-mt-md" />
        </div>

        <!-- Favorites Recipe List -->
        <div v-else class="row q-col-gutter-md">
          <div v-for="recipe in favorites" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
            <q-card class="recipe-card full-height" flat bordered>
              <router-link :to="`/recipe/${recipe.id}`" class="recipe-link">
                <!-- === NEW: Display Image === -->
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2" />
                </q-card-section>
                <!-- === -->

                <q-card-section class="q-pt-sm">
                  <div class="row justify-between no-wrap">
                    <div class="text-h6 ellipsis">{{ recipe.title }}</div>
                    <q-btn flat round color="primary" icon="bookmark" @click.prevent="toggleFavorite(recipe.id)" />
                  </div>
                  <p class="text-grey-8 ellipsis-3-lines">
                    {{ recipe.description }}
                  </p>
                </q-card-section>
              </router-link>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- Tab 2: My Private Recipes -->
      <q-tab-panel name="private">
        <p class="text-body1 text-grey-8">
          Your private recipes. These are only visible to you and do not grant
          XP.
        </p>

        <div v-if="loading.private" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="3em" />
        </div>
        <div v-if="error.private" class="q-pa-md">
          <q-banner rounded class="bg-red-1 text-red-8">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            <strong>Error fetching your recipes:</strong> {{ error.private }}
          </q-banner>
        </div>
        <div v-if="privateRecipes.length === 0 && !loading.private" class="text-center q-pa-xl">
          <q-icon name="edit_note" size="3em" class="text-grey-5 q-mb-sm" />
          <div class="text-h6 text-grey-7">No private recipes found.</div>
          <p class="q-mt-sm">
            Click "Add Private Recipe" to create your first one.
          </p>
        </div>

        <!-- Private Recipe List -->
        <div v-else class="row q-col-gutter-md">
          <div v-for="recipe in privateRecipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
            <q-card class="recipe-card full-height" flat bordered>
              <router-link :to="`/recipe/${recipe.id}`" class="recipe-link">
                <!-- === NEW: Display Image === -->
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2" />
                </q-card-section>
                <!-- === -->

                <q-card-section class="q-pt-sm">
                  <div class="text-h6 ellipsis">{{ recipe.title }}</div>
                  <p class="text-grey-8 ellipsis-3-lines q-mt-sm">
                    {{ recipe.description }}
                  </p>
                </q-card-section>
              </router-link>
              <q-separator />
              <q-card-actions align="right">
                <q-btn flat dense color="grey-7" label="Delete" @click="confirmDelete(recipe)" />
                <q-btn flat dense color="primary" label="Edit" :to="`/my-cookbook/private/edit/${recipe.id}`" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const $q = useQuasar();
const router = useRouter();

const tab = ref('favorites');

const favorites = ref([]);
const privateRecipes = ref([]);
const loading = reactive({ favorites: false, private: false });
const error = reactive({ favorites: null, private: null });

// --- API Fetch Helper ---
const API_URL = 'http://localhost:8080/api';
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = authStore.token;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      $q.notify({
        color: 'negative',
        message: 'Your session has expired. Please log in again.',
      });
      authStore.setUser(null);
      router.push('/');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  if (response.status === 200 && response.headers.get('content-length') === '0') {
    return null;
  }
  // Handle 204 No Content
  if (response.status === 204) return null;

  return response.json();
};
// --- End API Helper ---

// --- Favorites Tab Functions ---
const fetchMyCookbook = async () => {
  loading.favorites = true;
  error.favorites = null;
  try {
    const data = await fetchWithAuth('/my-cookbook');
    favorites.value = data || [];
  } catch (err) {
    error.favorites = err.message;
    console.error(err);
  } finally {
    loading.favorites = false;
  }
};

const toggleFavorite = async (recipeId) => {
  if (!authStore.user) return;
  try {
    favorites.value = favorites.value.filter((r) => r.id !== recipeId);
    authStore.removeFavoriteId(recipeId);
    await fetchWithAuth(`/recipes/${recipeId}/favorite`, { method: 'DELETE' });
    $q.notify({
      color: 'primary',
      message: 'Removed from cookbook',
      icon: 'bookmark_remove',
    });
  } catch (err) {
    console.error('Failed to remove favorite:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to remove favorite: ${err.message}`,
    });
    fetchMyCookbook();
  }
};

// --- Private Recipes Tab Functions ---
const fetchMyPrivateRecipes = async () => {
  loading.private = true;
  error.private = null;
  try {
    const data = await fetchWithAuth('/my-private-recipes');
    privateRecipes.value = data || [];
  } catch (err) {
    error.private = err.message;
    console.error(err);
  } finally {
    loading.private = false;
  }
};

const confirmDelete = (recipe) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete your private recipe "${recipe.title}"? This cannot be undone.`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Delete'
    }
  }).onOk(async () => {
    await deletePrivateRecipe(recipe.id);
  });
};

const deletePrivateRecipe = async (recipeId) => {
  try {
    await fetchWithAuth(`/recipes/private/${recipeId}`, { method: 'DELETE' });
    privateRecipes.value = privateRecipes.value.filter(r => r.id !== recipeId);
    $q.notify({
      color: 'positive',
      message: 'Private recipe deleted.'
    });
  } catch (err) {
    console.error('Failed to delete recipe:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to delete recipe: ${err.message}`
    });
  }
};


// --- Lifecycle ---
onMounted(() => {
  if (authStore.user) {
    fetchMyCookbook();
    fetchMyPrivateRecipes();
  } else {
    error.favorites = 'You must be logged in to view your cookbook.';
    error.private = 'You must be logged in to view your cookbook.';
  }
});
</script>

<style scoped>
/* FIX: This makes the private recipe card layout correctly */
.recipe-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.recipe-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  /* This is the key */
}

.recipe-link .q-card-section {
  flex-grow: 1;
}

.recipe-card .q-card-actions {
  flex-shrink: 0;
}

/* End Fix */

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.ellipsis-3-lines {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
