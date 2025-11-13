<template>
  <q-page class="q-pa-md">
    <!-- Main content area, centered -->
    <div style="max-width: 900px; margin: 0 auto">
      <!-- === Guild Card === -->
      <q-card v-if="authStore.user && guildProfile" class="q-mb-md" flat bordered>
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <!-- === MODIFIED: Avatar with Fallback + Referrer Policy === -->
            <q-avatar size="60px" :color="authStore.user.photoURL ? 'white' : 'secondary'"
              :text-color="authStore.user.photoURL ? 'primary' : 'white'">
              <img v-if="authStore.user.photoURL" :src="authStore.user.photoURL" alt="User avatar"
                referrerpolicy="no-referrer" />
              <template v-else>
                {{ userInitials }}
              </template>
            </q-avatar>

            <!-- User Info -->
            <div>
              <div class="text-h6">
                Welcome back, {{ authStore.user.displayName }}!
              </div>
              <div class="text-subtitle1 text-grey-8">
                Your Rank:
                <span class="text-weight-bold text-primary">{{
                  guildProfile.rank
                }}</span>
              </div>
            </div>

            <!-- XP -->
            <q-space />
            <div class="text-right">
              <div class="text-overline text-grey-7">XP</div>
              <div class="text-h5 text-weight-bold">
                {{ guildProfile.xp }}
              </div>
            </div>
          </div>

          <div v-if="guildProfile.badges && guildProfile.badges.length" class="q-mt-md">
            <div class="text-overline text-grey-7">Your Badges</div>
            <q-chip v-for="badge in guildProfile.badges" :key="badge.id" color="secondary" text-color="white" size="md"
              :label="badge.name" class="q-mr-sm">
              <template v-slot:prepend>
                <q-avatar v-if="badge.icon_url.Valid">
                  <q-img :src="badge.icon_url.String" v-if="badge.icon_url.String.startsWith('http')" />
                  <q-icon :name="badge.icon_url.String" v-else />
                </q-avatar>
                <q-avatar v-else icon="military_tech" color="transparent" text-color="white" />
              </template>

              <q-tooltip class="bg-black text-body2" :offset="[10, 10]">
                <div class="text-weight-bold">{{ badge.name }}</div>
                <div>{{ badge.description }}</div>
                <div class="text-caption q-mt-sm">
                  Earned: {{ formatJoinDate(badge.earned_at.Time) }}
                </div>
              </q-tooltip>
            </q-chip>
          </div>

        </q-card-section>
      </q-card>
      <!-- === End Guild Card === -->

      <div v-if="featuredRecipes.length > 0" class="q-mb-md">
        <h4 class="text-h4 q-mt-none q-mb-md">Featured Recipes</h4>
        <div class="row q-col-gutter-md">
          <div v-for="recipe in featuredRecipes" :key="recipe.id" class="col-12 col-md-6">
            <router-link :to="`/recipe/${recipe.id}-${recipe.slug}`" class="recipe-link">
              <q-card class="recipe-card full-height" flat bordered>
                <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
                <q-card-section class="q-pa-sm q-pb-none" v-else>
                  <q-img :ratio="16 / 9" class="bg-grey-2">
                    <div class="absolute-center text-grey-6 text-center">
                      <q-icon name="image" size="2em" />
                      <div class="text-caption">No Image</div>
                    </div>
                  </q-img>
                </q-card-section>

                <q-card-section class="q-pt-sm relative-position">
                  <q-btn v-if="authStore.user && favoritesLoaded" flat round
                    :color="isFavorited(recipe.id) ? 'primary' : 'grey'" :icon="isFavorited(recipe.id) ? 'bookmark' : 'bookmark_border'
                      " @click.prevent="toggleFavorite(recipe.id)" class="absolute-top-right"
                    style="top: 8px; right: 0px" />

                  <div class="row justify-between no-wrap items-center q-pr-xl">
                    <div class="text-h6 ellipsis">{{ recipe.title }}</div>
                    <q-chip color="accent" text-color="white" :label="recipe.xp + ' XP'" size="sm" class="q-ml-sm" />
                  </div>
                  <p class="text-grey-8 ellipsis-3-lines q-mt-xs">
                    {{ recipe.description }}
                  </p>

                  <div class="q-mt-sm" v-if="recipe.cook_count > 0">
                    <q-rating :model-value="recipe.avg_rating" size="xs" color="orange" icon="star" readonly />
                    <span class="text-caption text-grey-7 q-ml-xs">
                      ({{ recipe.cook_count }}
                      {{ recipe.cook_count === 1 ? 'review' : 'reviews' }})
                    </span>
                  </div>
                  <div class="q-mt-sm text-caption text-grey-6" v-else>
                    No reviews yet
                  </div>
                </q-card-section>
              </q-card>
            </router-link>
          </div>
        </div>
        <q-separator class="q-my-lg" />
      </div>
      <div class="row q-col-gutter-md">
        <div v-for="recipe in filteredRecipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
        </div>
      </div>

      <!-- Search and Filter Controls -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6">
          <q-input v-model="searchQuery" label="Search Recipes" outlined dense clearable>
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6">
          <q-select v-model="selectedTags" :options="availableTags" label="Filter by Tags" multiple outlined dense
            use-chips clearable>
            <template v-slot:prepend>
              <q-icon name="tag" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots color="primary" size="3em" />
      </div>

      <!-- Error Message -->
      <div v-if="error" class="q-pa-md">
        <q-banner rounded class="bg-red-1 text-red-8">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          <strong>Error fetching recipes:</strong> {{ error }}
        </q-banner>
      </div>

      <!-- No Results Message -->
      <div v-if="!loading && recipes.length === 0" class="text-center text-grey-7 q-pa-xl">
        <q-icon name="restaurant_menu" size="3em" class="q-mb-sm" />
        <div class="text-h6">No recipes found.</div>
        <p class="q-mt-sm" v-if="searchQuery || selectedTags.length > 0">
          Try adjusting your search or filters.
        </p>
        <p class="q-mt-sm" v-else>
          There are no approved Guild recipes... yet.
        </p>
      </div>

      <!-- Recipe List -->
      <div class="row q-col-gutter-md">
        <div v-for="recipe in recipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
          <router-link :to="`/recipe/${recipe.id}-${recipe.slug}`" class="recipe-link">
            <q-card class="recipe-card full-height" flat bordered>
              <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
              <q-card-section class="q-pa-sm q-pb-none" v-else>
                <q-img :ratio="16 / 9" class="bg-grey-2">
                  <div class="absolute-center text-grey-6 text-center">
                    <q-icon name="image" size="2em" />
                    <div class="text-caption">No Image</div>
                  </div>
                </q-img>
              </q-card-section>

              <q-card-section class="q-pt-sm relative-position">
                <q-btn v-if="authStore.user && favoritesLoaded" flat round
                  :color="isFavorited(recipe.id) ? 'primary' : 'grey'" :icon="isFavorited(recipe.id) ? 'bookmark' : 'bookmark_border'
                    " @click.prevent="toggleFavorite(recipe.id)" class="absolute-top-right"
                  style="top: 8px; right: 0px" />

                <div class="row justify-between no-wrap items-center q-pr-xl">
                  <div class="text-h6 ellipsis">{{ recipe.title }}</div>
                  <q-chip color="accent" text-color="white" :label="recipe.xp + ' XP'" size="sm" class="q-ml-sm" />
                </div>
                <p class="text-grey-8 ellipsis-3-lines q-mt-xs">
                  {{ recipe.description }}
                </p>

                <!-- === NEW: Rating Display === -->
                <div class="q-mt-sm" v-if="recipe.cook_count > 0">
                  <q-rating :model-value="recipe.avg_rating" size="xs" color="orange" icon="star" readonly />
                  <span class="text-caption text-grey-7 q-ml-xs">
                    ({{ recipe.cook_count }} {{ recipe.cook_count === 1 ? 'review' : 'reviews' }})
                  </span>
                </div>
                <div class="q-mt-sm text-caption text-grey-6" v-else>
                  No reviews yet
                </div>
                <!-- === END NEW === -->

              </q-card-section>
            </q-card>
          </router-link>
        </div>
      </div>

      <!-- Pagination -->
      <div class="q-pa-lg flex flex-center" v-if="totalPages > 1">
        <q-pagination v-model="currentPage" :max="totalPages" direction-links />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useRecipeStore } from 'stores/recipes';
import { useUserStore } from 'stores/user';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const recipeStore = useRecipeStore();
const userStore = useUserStore();

const { recipes, tags: availableTags, featuredRecipes } = storeToRefs(recipeStore);
const { profile: guildProfile } = storeToRefs(userStore);

const $q = useQuasar();

const loading = ref(false);
const error = ref(null);

const searchQuery = ref('');
const selectedTags = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);

const favoritesLoaded = ref(false);

// --- NEW: Computed prop for featured IDs ---
const featuredRecipeIds = computed(() =>
  featuredRecipes.value.map(r => r.id)
);

// --- NEW: Computed prop to filter main list ---
const filteredRecipes = computed(() =>
  recipes.value.filter(r => !featuredRecipeIds.value.includes(r.id))
);

const userInitials = computed(() => {
  if (authStore.user && authStore.user.displayName) {
    const parts = authStore.user.displayName.split(' ');
    if (parts.length > 1) {
      // Use first letter of first and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // Use first letter of single name
    return parts[0][0].toUpperCase();
  }
  return '?'; // Fallback for no name
});

const fetchRecipes = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params = {
      page: currentPage.value,
    };
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    if (selectedTags.value.length > 0) {
      params.tags = selectedTags.value.join(',');
    }

    const data = await recipeStore.fetchRecipes(params);
    totalPages.value = data.total_pages || 1;
    currentPage.value = data.current_page || 1;
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const fetchTags = async () => {
  try {
    await recipeStore.fetchTags();
  } catch (err) {
    console.error('Failed to fetch tags:', err);
  }
};

const fetchProfileAndFavorites = async () => {
  if (!authStore.user) return;
  try {
    await userStore.fetchProfileAndFavorites();
    favoritesLoaded.value = true;
  } catch (err) {
    console.error('Failed to fetch profile/favorites:', err);
    $q.notify({ color: 'negative', message: 'Could not load your profile.' })
  }
};

const formatJoinDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isFavorited = (recipeId) => {
  return Array.isArray(authStore.favoriteRecipeIds) && authStore.favoriteRecipeIds.includes(recipeId);
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
    await recipeStore.toggleFavorite(recipeId);
    if (alreadyFavorited) {
      $q.notify({
        color: 'primary',
        message: 'Removed from cookbook',
        icon: 'bookmark_remove'
      });
    } else {
      $q.notify({
        color: 'positive',
        message: 'Added to cookbook!',
        icon: 'bookmark_add'
      });
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to update cookbook: ${err.message}`,
    });
  }
};

watch([searchQuery, selectedTags], () => {
  currentPage.value = 1;
  fetchRecipes();
});

watch(currentPage, () => {
  fetchRecipes();
});

onMounted(() => {
  fetchRecipes();
  fetchTags();
  recipeStore.fetchFeaturedRecipes();
});

watch(
  () => authStore.authReady,
  (isReady) => {
    if (isReady && authStore.user) {
      console.log('Auth is ready and user is present. Fetching profile.');
      fetchProfileAndFavorites();
    } else if (isReady) {
      console.log('Auth is ready, but no user.');
      favoritesLoaded.value = false;
      userStore.profile = null;
    }
  },
  { immediate: true }
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
