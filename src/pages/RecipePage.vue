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
            <q-card-section>
              <div class="row items-start justify-between no-wrap">
                <h4 class="text-h4 q-mt-none q-mb-sm">{{ recipe.title }}</h4>
                <q-chip color="accent" text-color="white" :label="recipe.xp + ' XP'" size="lg" class="q-ml-md" />
              </div>
              <p class="text-body1 text-grey-8">{{ recipe.description }}</p>
              <div class="q-mt-md q-gutter-xs">
                <q-chip v-for="tag in recipe.tags" :key="tag" outline color="grey-7" :label="tag" />
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="text-h6 q-mb-sm">Ingredients</div>
              <!-- Placeholder for ingredients -->
              <q-list dense>
                <q-item>
                  <q-item-section avatar>
                    <q-icon color="primary" name="check_circle_outline" />
                  </q-item-section>
                  <q-item-section>Ingredient 1</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar>
                    <q-icon color="primary" name="check_circle_outline" />
                  </q-item-section>
                  <q-item-section>Ingredient 2</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar>
                    <q-icon color="primary" name="check_circle_outline" />
                  </q-item-section>
                  <q-item-section>Ingredient 3</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="text-h6 q-mb-sm">Method</div>
              <!-- Placeholder for method -->
              <p>
                1. This is step one for the recipe. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit.
              </p>
              <p>
                2. This is step two. Duis aute irure dolor in reprehenderit in
                voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
            </q-card-section>
          </q-card>
        </div>

        <!-- Log Cook & Guild Logs -->
        <div class="col-12 col-md-5">
          <!-- "I Made This!" Button Card -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="text-center">
              <div class="text-h6 q-mb-sm">Have you cooked this?</div>
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
                  {{ log.username }}
                  <!-- Show star rating if it exists -->
                  <q-rating v-if="log.rating" :model-value="log.rating" color="orange" icon="star" size="xs" readonly
                    class="q-ml-sm" />
                </q-item-label>
                <!-- Show notes if they exist -->
                <q-item-label v-if="log.notes" class="q-mt-sm">
                  {{ log.notes }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  Logged {{ formatTimeAgo(log.created_at) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
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
import { ref, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';

const route = useRoute();
const authStore = useAuthStore();
const $q = useQuasar();

// --- API Config ---
const API_URL = 'http://localhost:8080/api';
const recipeId = route.params.id;

// --- Page State Refs ---
const recipe = ref(null);
const loading = ref(false);
const error = ref(null);

const cookLogs = ref([]);
const logsLoading = ref(false);
const logsError = ref(null);

// --- Dialog State ---
const showLogDialog = ref(false);
const isSubmitting = ref(false);
const logForm = reactive({
  notes: '',
  rating: 0,
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
  // Handle 204 No Content (for POST requests)
  if (response.status === 204) return null;
  return response.json();
};

// --- API Call Functions ---
const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await fetchWithAuth(`/recipes/${recipeId}`);
    recipe.value = data;
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
    const data = await fetchWithAuth(`/recipes/${recipeId}/logs`);
    cookLogs.value = data;
  } catch (err) {
    logsError.value = err.message;
    console.error(err);
  } finally {
    logsLoading.value = false;
  }
};

// --- Dialog Functions ---
const openLogDialog = () => {
  if (!authStore.user) {
    $q.notify({
      color: 'negative',
      message: 'You must be logged in to log a cook.',
    });
    return;
  }
  // Reset form
  logForm.notes = '';
  logForm.rating = 0;
  showLogDialog.value = true;
};

const handleLogSubmit = async () => {
  isSubmitting.value = true;

  try {
    const response = await fetchWithAuth(`/recipes/${recipeId}/log`, {
      method: 'POST',
      body: JSON.stringify({
        notes: logForm.notes,
        // Send `null` if rating is 0, otherwise send the number
        rating: logForm.rating > 0 ? logForm.rating : null,
      }),
    });

    // --- Show Success Notifications ---
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

    // Close dialog and refresh logs
    showLogDialog.value = false;
    await fetchCookLogs(); // Refresh the log list
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

// --- Time Ago Formatter ---
const formatTimeAgo = (isoString) => {
  const date = new Date(isoString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchRecipe();
  fetchCookLogs();
});
</script>

<style scoped>
.text-h4 {
  font-weight: 600;
  line-height: 1.2;
}
</style>
