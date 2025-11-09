<template>
  <q-page class="q-pa-md" style="max-width: 1000px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">Admin Dashboard</h4>
    <p class="text-body1 text-grey-8 q-mb-lg">
      Review pending recipe submissions from the Guild.
    </p>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <div v-if="error" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error fetching pending recipes:</strong> {{ error }}
      </q-banner>
    </div>

    <div v-if="recipes.length === 0 && !loading" class="text-center q-pa-xl">
      <q-icon name="done_all" size="3em" class="text-grey-5 q-mb-sm" />
      <div class="text-h6 text-grey-7">No pending submissions.</div>
      <p>All caught up!</p>
    </div>

    <q-list v-else separator bordered>
      <q-expansion-item v-for="recipe in recipes" :key="recipe.id" group="pending-recipes" header-class="text-h6"
        :label="recipe.title" :caption="'XP: ' + recipe.xp">
        <q-card>
          <q-card-section>
            <p><strong>Description:</strong> {{ recipe.description }}</p>

            <!-- === NEW: Show Ingredients === -->
            <div class="q-mb-md">
              <div class="text-weight-bold q-mb-xs">Ingredients:</div>
              <q-list dense bordered padding class="rounded-borders">
                <q-item v-if="!recipe.ingredients || recipe.ingredients.length === 0">
                  <q-item-section class="text-grey-7">No ingredients submitted.</q-item-section>
                </q-item>
                <q-item v-for="(item, index) in recipe.ingredients" :key="index">
                  <q-item-section>
                    <q-item-label>
                      <strong v-if="item.quantity">{{ item.quantity }}</strong>
                      {{ item.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- === NEW: Show Instructions === -->
            <div class="q-mb-md">
              <div class="text-weight-bold q-mb-xs">Instructions:</div>
              <q-list dense bordered padding class="rounded-borders">
                <q-item v-if="!recipe.instructions || recipe.instructions.length === 0">
                  <q-item-section class="text-grey-7">No instructions submitted.</q-item-section>
                </q-item>
                <q-item v-for="(item, index) in recipe.instructions" :key="index">
                  <q-item-section avatar class="text-weight-bold">{{ index + 1 }}.</q-item-section>
                  <q-item-section>{{ item.step }}</q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Tags -->
            <div class="q-gutter-xs">
              <strong>Tags:</strong>
              <template v-if="recipe.tags && recipe.tags.length > 0">
                <q-chip v-for="tag in recipe.tags" :key="tag" size="sm" :label="tag" />
              </template>
              <q-chip v-else size="sm" outline label="No tags" />
            </div>

            <p class="q-mt-md text-grey-7 text-caption">
              (ID: {{ recipe.id }}, Submitted by:
              {{ recipe.submitted_by_username.String || recipe.submitted_by_user_id.String || 'Unknown' }})
            </p>
          </q-card-section>

          <q-card-actions align="right" class="q-gutter-sm q-pa-md">
            <q-btn label="Reject" color="negative" @click="handleAction(recipe.id, 'reject')"
              :loading="actionLoading[recipe.id]" />
            <q-btn label="Approve" color="positive" @click="handleAction(recipe.id, 'approve')"
              :loading="actionLoading[recipe.id]" />
          </q-card-actions>
        </q-card>
      </q-expansion-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const $q = useQuasar();

const recipes = ref([]);
const loading = ref(false);
const error = ref(null);
const actionLoading = reactive({}); // To track loading state per button

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
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  return response.json();
};
// --- End API Helper ---

const fetchPendingRecipes = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await fetchWithAuth('/admin/pending-recipes');
    recipes.value = data;
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleAction = async (recipeId, action) => {
  actionLoading[recipeId] = true;
  try {
    const response = await fetchWithAuth(
      `/admin/recipes/${recipeId}/${action}`,
      {
        method: 'POST',
      }
    );

    $q.notify({
      color: 'positive',
      message: `Recipe ${action}ed! ${response.message || ''}`,
    });

    // Remove the recipe from the list
    recipes.value = recipes.value.filter((r) => r.id !== recipeId);
  } catch (err) {
    $q.notify({
      color: 'negative',
      message: `Action failed: ${err.message}`,
    });
  } finally {
    actionLoading[recipeId] = false;
  }
};

onMounted(() => {
  fetchPendingRecipes();
});
</script>
