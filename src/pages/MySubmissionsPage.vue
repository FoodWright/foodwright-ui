<template>
  <q-page class="q-pa-md" style="max-width: 900px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">My Submissions</h4>
    <p class="text-body1 text-grey-8">
      Track the status of your Guild submissions here.
    </p>

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
        <strong>Error fetching submissions:</strong> {{ error }}
      </q-banner>
    </div>

    <!-- No Submissions Message -->
    <div v-if="recipes.length === 0 && !loading" class="text-center q-pa-xl">
      <q-icon name="file_upload_off" size="3em" class="text-grey-5 q-mb-sm" />
      <div class="text-h6 text-grey-7">No submissions yet.</div>
      <p class="q-mt-sm">
        Submit your first recipe to the Guild to earn XP!
      </p>
      <q-btn to="/submit" label="Submit a Recipe" color="primary" class="q-mt-md" />
    </div>

    <!-- Submissions List -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="recipe in recipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="recipe-card full-height" flat bordered>
          <!-- === NEW: Display Image === -->
          <q-img v-if="recipe.image_url.Valid" :src="recipe.image_url.String" :ratio="16 / 9" />
          <q-card-section class="q-pa-sm q-pb-none" v-else>
            <q-img :ratio="16 / 9" class="bg-grey-2" />
          </q-card-section>
          <!-- === -->

          <q-card-section class="q-pt-sm">
            <div class="row items-center justify-between no-wrap">
              <div class="text-h6 ellipsis">{{ recipe.title }}</div>
              <q-chip :color="statusColor(recipe.status)" text-color="white" :label="recipe.status" size="sm"
                class="q-ml-sm text-capitalize" />
            </div>
            <p class="text-grey-8 ellipsis-3-lines q-mt-xs">
              {{ recipe.description }}
            </p>
          </q-card-section>

          <q-space />

          <q-card-actions align="right" class="q-pa-md">
            <!-- Show 'Edit' if it's 'private' or 'rejected' -->
            <q-btn v-if="recipe.status === 'private' || recipe.status === 'rejected'"
              :to="`/my-cookbook/private/edit/${recipe.id}`" label="Edit" color="primary" flat dense />
            <!-- Show 'View' if it's 'approved' -->
            <q-btn v-if="recipe.status === 'approved'" :to="`/recipe/${recipe.id}`" label="View" color="primary" flat
              dense />
            <!-- Show 'Pending' as text if pending -->
            <q-item-label v-if="recipe.status === 'pending'" caption>
              Pending Review
            </q-item-label>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from 'stores/auth';
// import { useQuasar } from 'quasar';

const authStore = useAuthStore();
// const $q = useQuasar();

const recipes = ref([]);
const loading = ref(false);
const error = ref(null);

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

const fetchMySubmissions = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await fetchWithAuth('/recipes/my-submissions');
    recipes.value = data || [];
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const statusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'positive';
    case 'pending':
      return 'orange';
    case 'rejected':
      return 'negative';
    case 'private':
      return 'grey-7';
    default:
      return 'primary';
  }
};

onMounted(() => {
  if (authStore.user) {
    fetchMySubmissions();
  } else {
    error.value = 'You must be logged in to view your submissions.';
  }
});
</script>

<style scoped>
.recipe-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
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
