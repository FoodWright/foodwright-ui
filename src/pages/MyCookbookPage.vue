<template>
  <q-page class="q-pa-md" style="max-width: 900px; margin: 0 auto">
    <div class="row items-center justify-between q-mb-md">
      <h4 class="text-h4 q-mt-none q-mb-none">My Cookbook</h4>
      <div>
        <q-btn v-if="tab === 'my-recipes'" @click="openImportDialog" label="Import from URL" color="secondary" icon="link"
          class="q-mr-md" />
        <q-btn v-if="tab === 'my-recipes'" to="/my-cookbook/private/new" label="New Recipe" color="primary"
          icon="add" />
      </div>
    </div>

    <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="left"
      narrow-indicator>
      <q-tab name="favorites" label="Favorites" />
      <q-tab name="my-recipes" label="My Recipes" />
    </q-tabs>

    <q-separator class="q-mb-lg" />

    <q-tab-panels v-model="tab" animated>
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
            <strong>Error fetching your favorites:</strong>
            {{ error.favorites }}
          </q-banner>
        </div>
        <div v-if="favorites.length === 0 && !loading.favorites" class="text-center q-pa-xl">
          <q-icon name="bookmark_border" size="3em" class="text-grey-5 q-mb-sm" />
          <div class="text-h6 text-grey-7">No favorite recipes yet.</div>
          <p class="q-mt-sm">
            Click the bookmark icon on any recipe to save it here.
          </p>
          <q-btn to="/recipes" label="Find Recipes" color="primary" class="q-mt-md" />
        </div>

        <div v-else class="row q-col-gutter-md">
          <div v-for="recipe in favorites" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
            <q-card class="recipe-card full-height" flat bordered>
              <router-link :to="`/recipe/${recipe.id}-${recipe.slug}`" class="recipe-link">
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2" />
                </q-card-section>

                <q-card-section class="q-pt-sm">
                  <div class="row items-center justify-between no-wrap">
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

      <q-tab-panel name="my-recipes">
        <p class="text-body1 text-grey-8">
          Recipes you've created. Public recipes are visible to everyone in the feed.
        </p>

        <div v-if="loading.myRecipes" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="3em" />
        </div>
        <div v-if="error.myRecipes" class="q-pa-md">
          <q-banner rounded class="bg-red-1 text-red-8">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            <strong>Error fetching your recipes:</strong> {{ error.myRecipes }}
          </q-banner>
        </div>
        <div v-if="myRecipes.length === 0 && !loading.myRecipes" class="text-center q-pa-xl">
          <q-icon name="edit_note" size="3em" class="text-grey-5 q-mb-sm" />
          <div class="text-h6 text-grey-7">No recipes found.</div>
          <p class="q-mt-sm">
            Click "New Recipe" to create your first one.
          </p>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div v-for="recipe in myRecipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
            <q-card class="recipe-card full-height" flat bordered>
              <router-link :to="`/recipe/${recipe.id}-${recipe.slug}`" class="recipe-link">
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2" />
                </q-card-section>

                <q-card-section class="q-pt-sm">
                  <div class="row items-center justify-between no-wrap">
                    <div class="text-h6 ellipsis">{{ recipe.title }}</div>
                    <q-chip :color="recipe.status === 'public' ? 'positive' : 'grey-7'" 
                      text-color="white" :label="recipe.status" size="xs" dense />
                  </div>
                  <p class="text-grey-8 ellipsis-3-lines q-mt-sm">
                    {{ recipe.description }}
                  </p>
                </q-card-section>
              </router-link>
              <q-separator />
              <q-card-actions align="right">
                <q-btn flat dense color="grey-7" label="Delete" @click="confirmDelete(recipe)" />
                <q-btn flat dense color="primary" label="Edit" :to="`/my-cookbook/private/edit/${recipe.id}`" />

                <q-btn v-if="recipe.status === 'private'" flat dense color="positive" label="Share to Feed" @click="confirmPublish(recipe)" />
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
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const recipeStore = useRecipeStore();
const { favorites, myRecipes } = storeToRefs(recipeStore);

const $q = useQuasar();
const router = useRouter();

const tab = ref('favorites');

const loading = reactive({ favorites: false, myRecipes: false });
const error = reactive({ favorites: null, myRecipes: null });

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

const fetchMyRecipes = async () => {
  loading.myRecipes = true;
  error.myRecipes = null;
  try {
    await recipeStore.fetchMyRecipes();
  } catch (err) {
    error.myRecipes = err.message;
    console.error(err);
  } finally {
    loading.myRecipes = false;
  }
};

const confirmDelete = (recipe) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete your recipe "${recipe.title}"? This cannot be undone.`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Delete',
    },
  }).onOk(async () => {
    await deleteMyRecipe(recipe.id);
  });
};

const confirmPublish = (recipe) => {
  $q.dialog({
    title: 'Share to Feed?',
    message: `Are you sure you want to make "${recipe.title}" public and share it to the social feed?`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'positive',
      label: 'Share Now',
    },
  }).onOk(async () => {
    try {
      await recipeStore.submitToGuild(recipe.id);
      $q.notify({
        color: 'positive',
        message: 'Recipe shared to feed!',
        icon: 'share'
      });
      fetchMyRecipes(); // Refresh to update status
    } catch (err) {
      console.error('Failed to share recipe:', err);
      $q.notify({
        color: 'negative',
        message: `Sharing failed: ${err.message}`,
      });
    }
  });
};

const openImportDialog = () => {
  $q.dialog({
    title: 'Import Recipe from URL',
    message: 'Enter the URL of the recipe you want to import.',
    prompt: {
      model: '',
      type: 'text',
      placeholder: 'https://www.example.com/recipe',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (url) => {
    if (!url || !url.startsWith('http')) {
      $q.notify({ color: 'negative', message: 'Please enter a valid URL.' });
      return;
    }

    $q.loading.show({ message: 'Importing recipe...' });

    try {
      const importedRecipe = await recipeStore.importRecipeFromUrl(url);
      recipeStore.setRecipeToEdit(importedRecipe);
      $q.loading.hide();
      router.push('/my-cookbook/private/new');
    } catch (err) {
      $q.loading.hide();
      console.error('Import failed:', err);
      $q.notify({
        color: 'negative',
        message: `Import failed: ${err.message || 'Unknown error'}`,
        timeout: 4000,
      });
    }
  });
};

const deleteMyRecipe = async (recipeId) => {
  try {
    await recipeStore.deleteMyRecipe(recipeId);
    $q.notify({
      color: 'positive',
      message: 'Recipe deleted.',
    });
  } catch (err) {
    console.error('Failed to delete recipe:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to delete recipe: ${err.message}`,
    });
  }
};
onMounted(() => {
  if (authStore.user) {
    fetchMyCookbook();
    fetchMyRecipes();
  } else {
    error.favorites = 'You must be logged in to view your cookbook.';
    error.myRecipes = 'You must be logged in to view your cookbook.';
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
