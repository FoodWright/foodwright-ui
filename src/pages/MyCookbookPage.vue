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
              <router-link :to="`/recipe/${recipe.id}-${recipe.slug}`" class="recipe-link">
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2" />
                </q-card-section>

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
              <router-link :to="`/recipe/${recipe.id}-${recipe.slug}`" class="recipe-link">
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2" />
                </q-card-section>

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
import { useRecipeStore } from 'stores/recipes';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const recipeStore = useRecipeStore();
const { favorites, privateRecipes } = storeToRefs(recipeStore);

const $q = useQuasar();

const tab = ref('favorites');

const loading = reactive({ favorites: false, private: false });
const error = reactive({ favorites: null, private: null });

const fetchMyCookbook = async () => {
  loading.favorites = true;
  error.favorites = null;
  try {
    await recipeStore.fetchMyCookbook();
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
    await recipeStore.toggleFavorite(recipeId);
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
    fetchMyCookbook(); // Refetch on error
  }
};

const fetchMyPrivateRecipes = async () => {
  loading.private = true;
  error.private = null;
  try {
    await recipeStore.fetchMyPrivateRecipes();
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
    await recipeStore.deletePrivateRecipe(recipeId);
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
}

.recipe-link .q-card-section {
  flex-grow: 1;
}

.recipe-card .q-card-actions {
  flex-shrink: 0;
}

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
