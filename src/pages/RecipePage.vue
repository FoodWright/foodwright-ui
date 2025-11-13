<template>
  <q-page class="q-pa-md">
    <!-- Loading Spinner for Page -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <!-- Error Message for Page -->
    <div v-if="error" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error fetching recipe:</strong> {{ error }}
      </q-banner>
      <q-btn flat @click="$router.go(-1)" label="Go Back" class="q-mt-md" />
    </div>

    <!-- Recipe Content -->
    <div v-if="recipe" class="recipe-container">
      <div class="row q-col-gutter-lg">
        <!-- Main Recipe Details -->
        <div class="col-12 col-md-7">
          <q-card flat bordered class="full-height">
            <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />

            <q-card-section>
              <div class="row items-start justify-between no-wrap">
                <h4 class="text-h4 q-mt-none q-mb-sm q-pr-lg">
                  {{ recipe.title }}
                </h4>

                <q-btn v-if="authStore.user" flat round :color="isFavorited ? 'primary' : 'grey'" :icon="isFavorited ? 'bookmark' : 'bookmark_border'
                  " @click.prevent="toggleFavorite" class="q-ml-md">
                  <q-tooltip>{{ isFavorited ? 'Remove from Cookbook' : 'Add to Cookbook' }}</q-tooltip>
                </q-btn>
                <q-btn v-if="authStore.isSiteAdmin" flat round :color="recipe.is_featured ? 'positive' : 'grey'"
                  :icon="recipe.is_featured ? 'star' : 'star_border'" @click.prevent="toggleFeature" class="q-ml-sm">
                  <q-tooltip>{{ recipe.is_featured ? 'Remove from Featured' : 'Mark as Featured' }}</q-tooltip>
                </q-btn>
              </div>
              <p class="text-body1 text-grey-8">{{ recipe.description }}</p>

              <div v-if="recipe.submitted_by_username.Valid" class="q-mt-sm text-caption text-grey-7">
                Submitted by:
                <router-link :to="`/user/${recipe.submitted_by_user_id.String}`" class="user-link">
                  {{ recipe.submitted_by_username.String }}
                </router-link>
              </div>

              <div class="q-mt-md q-gutter-xs">
                <q-chip v-for="tag in recipe.tags" :key="tag" outline color="grey-7" :label="tag" />
              </div>

              <!-- === NEW: Guild Rating Section === -->
              <q-separator class="q-my-md" />
              <div>
                <div class="text-h6 q-mb-xs">Guild Rating</div>
                <div v-if="recipe.cook_count > 0" class="row items-center q-gutter-sm">
                  <q-rating :model-value="recipe.avg_rating" size="md" color="orange" icon="star" readonly />
                  <div class="text-body1 text-grey-8">
                    {{ recipe.avg_rating.toFixed(1) }} out of 5
                  </div>
                  <div class="text-caption text-grey-7">
                    ({{ recipe.cook_count }} {{ recipe.cook_count === 1 ? 'rating' : 'ratings' }})
                  </div>
                </div>
                <div v-else class="text-body1 text-grey-7">
                  No ratings yet. Be the first to log a cook!
                </div>
              </div>
              <!-- === END NEW === -->

            </q-card-section>
            <q-separator />

            <!-- Ingredients List -->
            <q-card-section>
              <div class="text-h6 q-mb-sm">Ingredients</div>
              <div v-if="!recipe.ingredients || recipe.ingredients.length === 0" class="text-grey-7">
                No ingredients listed.
              </div>
              <q-list v-else dense>
                <template v-for="(item, index) in recipe.ingredients" :key="index">
                  <!-- Case 1: Header -->
                  <q-item-label v-if="item.type === 'header'" header class="text-primary text-weight-bold q-mt-md"
                    style="font-size: 1.1em">
                    {{ item.name }}
                  </q-item-label>

                  <!-- Case 2: Ingredient (or old data) -->
                  <q-item v-if="item.type === 'ingredient' || !item.type" class="q-pl-none">
                    <q-item-section avatar style="min-width: 40px">
                      <q-icon color="primary" name="check_circle_outline" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        <strong v-if="item.quantity">{{ item.quantity }}
                        </strong>
                        {{ item.name }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
            </q-card-section>
            <q-separator />

            <!-- Instructions List -->
            <q-card-section>
              <div class="text-h6 q-mb-sm">Instructions</div>
              <div v-if="!recipe.instructions || recipe.instructions.length === 0" class="text-grey-7">
                No instructions provided.
              </div>
              <q-list v-else class="instruction-list">
                <q-item v-for="(item, index) in recipe.instructions" :key="index" class="q-mb-sm">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="md">
                      {{ index + 1 }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-body1">{{
                      item.step
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- Right Column: Logs & Comments -->
        <div class="col-12 col-md-5">
          <!-- "I Made This!" Button Card -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="text-center">
              <div class="row items-center justify-between no-wrap">
                <div class="text-h6 q-mb-sm">Have you cooked this?</div>
                <q-chip color="accent" text-color="white" :label="recipe.xp + ' XP'" size="md" class="q-ml-sm" />
              </div>
              <p class="text-grey-8">
                Log your cook to earn XP, unlock badges, and help the guild!
              </p>
              <q-btn color="positive" size="lg" @click="openLogDialog" label="I Made This!" class="full-width"
                :disable="!authStore.user" />
              <q-item-label v-if="!authStore.user" caption class="q-mt-sm">
                You must be logged in to log a cook.
              </q-item-label>
            </q-card-section>
          </q-card>

          <!-- Guild Cook's Log -->
          <div class="text-h6 q-mb-sm">Guild Cook's Log</div>

          <div v-if="logsLoading" class="text-center q-pa-md">
            <q-spinner-dots color="primary" size="2em" />
          </div>
          <div v-if="logsError" class="text-red">
            Error fetching logs: {{ logsError }}
          </div>

          <div v-if="cookLogs.length === 0 && !logsLoading" class="text-center text-grey-7 q-pa-md">
            <q-icon name="menu_book" size="2em" class="q-mb-sm" />
            <div>Be the first in the guild to log this cook!</div>
          </div>

          <!-- Log List -->
          <q-list v-else separator>
            <q-item v-for="log in cookLogs" :key="log.id" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-bold">
                  <router-link :to="`/user/${log.user_id}`" class="user-link">
                    {{ log.username }}
                  </router-link>

                  <q-rating v-if="log.rating" :model-value="log.rating" color="orange" icon="star" size="xs" readonly
                    class="q-ml-sm" />
                </q-item-label>
                <q-item-label v-if="log.notes" class="q-mt-sm">
                  {{ log.notes }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  Logged {{ formatTimeAgo(log.created_at) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- === NEW: Comments Section === -->
          <div class="text-h6 q-mb-sm q-mt-lg">Guild Comments</div>

          <q-card v-if="authStore.user" flat bordered class="q-mb-md">
            <q-card-section>
              <q-form @submit.prevent="handleCommentSubmit" class="q-gutter-sm">
                <q-input v-model="newComment" label="Have a question or suggestion?" type="textarea" outlined
                  autogrow />
                <q-btn label="Submit Comment" type="submit" color="primary" :loading="isSubmittingComment"
                  :disable="newComment.trim() === ''" class="full-width" />
              </q-form>
            </q-card-section>
          </q-card>

          <div v-else class="text-grey-7 q-mb-md">
            You must be logged in to post a comment.
          </div>

          <!-- Comments Loading/Error -->
          <div v-if="commentsLoading" class="text-center q-pa-md">
            <q-spinner-dots color="primary" size="2em" />
          </div>
          <div v-if="commentsError" class="text-red">
            Error fetching comments: {{ commentsError }}
          </div>

          <!-- No Comments State -->
          <div v-if="comments.length === 0 && !commentsLoading" class="text-center text-grey-7 q-pa-md">
            <q-icon name="forum" size="2em" class="q-mb-sm" />
            <div>Be the first to post a comment!</div>
          </div>

          <!-- Comments List -->
          <q-list v-else separator>
            <q-item v-for="comment in comments" :key="comment.id" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-bold">
                  <router-link :to="`/user/${comment.user_id}`" class="user-link" v-if="comment.user_id">
                    {{ comment.username }}
                  </router-link>
                  <span v-else>{{ comment.username }}</span>
                </q-item-label>
                <q-item-label class="q-mt-sm comment-text">
                  {{ comment.comment }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  Posted {{ formatTimeAgo(comment.created_at) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <!-- === END: Comments Section === -->

        </div>
      </div>
    </div>

    <!-- "Log Your Cook" Dialog (Modal) -->
    <q-dialog v-model="showLogDialog" persistent>
      <q-card style="min-width: 350px">
        <q-form @submit="handleLogSubmit">
          <q-card-section>
            <div class="text-h6">Log Your Cook</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class-="text-body1 q-mb-sm">How did it turn out?</div>
            <q-rating v-model="logForm.rating" color="orange" icon="star_border" icon-selected="star" size="2.5em"
              class="q-mb-md" />

            <q-input v-model="logForm.notes" label="Cook's Notes (optional)" type="textarea" outlined autogrow />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" v-close-popup :disable="isSubmitting" />
            <q-btn label="Submit Log" type="submit" color="positive" :loading="isSubmitting" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useRecipeStore } from 'stores/recipes';
import { useAdminStore } from 'stores/admin';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';

const route = useRoute();
const authStore = useAuthStore();
const recipeStore = useRecipeStore();
const adminStore = useAdminStore();
const { recipe, cookLogs, comments } = storeToRefs(recipeStore);
const $q = useQuasar();

// const recipeId = parseInt(route.params.id, 10);

const idParam = route.params.id; // "9-simple-sourdough"
const recipeId = parseInt(idParam.split('-')[0], 10); // 9

const loading = ref(false);
const error = ref(null);
const logsLoading = ref(false);
const logsError = ref(null);
const commentsLoading = ref(false);
const commentsError = ref(null);
const newComment = ref('');
const isSubmittingComment = ref(false);

const showLogDialog = ref(false);
const isSubmitting = ref(false);
const logForm = reactive({
  notes: '',
  rating: 0,
});

const toggleFeature = async () => {
  if (!recipe.value) return;
  try {
    await adminStore.toggleRecipeFeature(recipeId);
    $q.notify({
      color: recipe.value.is_featured ? 'positive' : 'primary',
      message: recipe.value.is_featured ? 'Recipe marked as featured!' : 'Recipe removed from featured.',
      icon: recipe.value.is_featured ? 'star' : 'star_border',
    });
  } catch (err) {
    console.error('Failed to toggle feature:', err);
    $q.notify({
      color: 'negative',
      message: `Update failed: ${err.message}`,
    });
  }
};

const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  try {
    // We clear the old recipe from the store first
    recipeStore.recipe = null;
    await recipeStore.fetchRecipe(recipeId);
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const fetchCookLogs = async () => {
  logsLoading.value = true;
  logsError.value = null;
  try {
    await recipeStore.fetchCookLogs(recipeId);
  } catch (err) {
    logsError.value = err.message;
    console.error(err);
  } finally {
    logsLoading.value = false;
  }
};

const fetchComments = async () => {
  commentsLoading.value = true;
  commentsError.value = null;
  try {
    await recipeStore.fetchComments(recipeId);
  } catch (err) {
    commentsError.value = err.message;
    console.error(err);
  } finally {
    commentsLoading.value = false;
  }
};

const openLogDialog = () => {
  if (!authStore.user) {
    $q.notify({
      color: 'negative',
      message: 'You must be logged in to log a cook.',
    });
    return;
  }
  logForm.notes = '';
  logForm.rating = 0;
  showLogDialog.value = true;
};

const handleLogSubmit = async () => {
  isSubmitting.value = true;
  try {
    const response = await recipeStore.logCook(recipeId, {
      notes: logForm.notes,
      rating: logForm.rating > 0 ? logForm.rating : null,
    });
    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: `Cook logged! +${response.xp_granted} XP`,
    });
    if (response.rank_up) {
      $q.notify({
        color: 'primary',
        icon: 'military_tech',
        message: `Rank Up! You are now a ${response.new_rank}!`,
        timeout: 4000,
      });
    }
    if (response.new_badges_awarded && response.new_badges_awarded.length > 0) {
      response.new_badges_awarded.forEach((badge) => {
        $q.notify({
          color: 'amber-8',
          icon: 'workspace_premium',
          message: `Badge Unlocked: ${badge}!`,
          timeout: 5000,
        });
      });
    }
    showLogDialog.value = false;
    // --- NEW: Refresh the main recipe data to update rating ---
    await fetchRecipe();
  } catch (err) {
    console.error('Failed to log cook:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to log cook: ${err.message}`,
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleCommentSubmit = async () => {
  if (newComment.value.trim() === '') return;
  isSubmittingComment.value = true;
  try {
    await recipeStore.postComment(recipeId, newComment.value);
    newComment.value = '';
  } catch (err) {
    console.error('Failed to post comment:', err);
    $q.notify({
      color: 'negative',
      message: `Failed to post comment: ${err.message}`,
    });
  } finally {
    isSubmittingComment.value = false;
  }
};

const formatTimeAgo = (isoString) => {
  const date = new Date(isoString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const isFavorited = computed(() => {
  return (
    Array.isArray(authStore.favoriteRecipeIds) &&
    authStore.favoriteRecipeIds.includes(recipeId)
  );
});

const toggleFavorite = async () => {
  if (!authStore.user) {
    $q.notify({
      color: 'negative',
      message: 'You must be logged in to save recipes.',
    });
    return;
  }

  const alreadyFavorited = isFavorited.value;
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

onMounted(() => {
  fetchRecipe();
  fetchCookLogs();
  fetchComments();
});
</script>

<style scoped>
.recipe-container {
  max-width: 1200px;
  margin: 0 auto;
}

.user-link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.user-link:hover {
  text-decoration: underline;
}

.comment-text {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.instruction-list .q-item {
  align-items: flex-start;
}
</style>
