<template>
  <q-page class="q-pa-md" style="max-width: 900px; margin: 0 auto">
    <h4 class="text-h4 q-mt-none q-mb-md">My Submissions</h4>
    <p class="text-body1 text-grey-8 q-mb-lg">
      Track the status of your submitted recipes.
    </p>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <div v-if="error" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error fetching submissions:</strong> {{ error }}
      </q-banner>
    </div>

    <div v-if="recipes.length === 0 && !loading" class="text-center q-pa-xl">
      <q-icon name="edit_note" size="3em" class="text-grey-5 q-mb-sm" />
      <div class="text-h6 text-grey-7">You haven't submitted any recipes.</div>
      <q-btn to="/submit" label="Submit Your First Recipe" color="primary" class="q-mt-md" />
    </div>

    <q-list v-else separator bordered>
      <q-item v-for="recipe in recipes" :key="recipe.id" class="q-py-md">
        <q-item-section>
          <q-item-label class="text-h6">{{ recipe.title }}</q-item-label>
          <q-item-label caption class="q-mb-sm">
            Submitted {{ formatTimeAgo(recipe.created_at) }}
          </q-item-label>
          <q-item-label>{{ recipe.description }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-chip :color="statusColor(recipe.status)" text-color="white" :icon="statusIcon(recipe.status)"
            :label="recipe.status" />
        </q-item-section>
      </q-item>
    </q-list>
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
    recipes.value = data;
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// --- UI Helpers ---
const statusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'positive';
    case 'pending':
      return 'orange';
    case 'rejected':
      return 'negative';
    default:
      return 'grey';
  }
};

const statusIcon = (status) => {
  switch (status) {
    case 'approved':
      return 'check_circle';
    case 'pending':
      return 'hourglass_top';
    case 'rejected':
      return 'cancel';
    default:
      return 'help';
  }
};

const formatTimeAgo = (isoString) => {
  const date = new Date(isoString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

onMounted(() => {
  if (authStore.user) {
    fetchMySubmissions();
  } else {
    error.value = 'You must be logged in to view your submissions.';
  }
});
</script>
