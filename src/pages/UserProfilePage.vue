<template>
  <q-page class="q-pa-md" style="max-width: 900px; margin: 0 auto">
    <!-- Loading Spinner -->
    <div v-if="loading.profile" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>

    <!-- Error Message -->
    <div v-if="error.profile" class="q-pa-md">
      <q-banner rounded class="bg-red-1 text-red-8">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <strong>Error fetching profile:</strong> {{ error.profile }}
        <p>This guild member may not exist.</p>
      </q-banner>
    </div>

    <!-- Profile Content -->
    <div v-if="profile" class="row q-col-gutter-lg">
      <!-- Left Column: Profile Card -->
      <div class="col-12 col-md-4">
        <q-card class="bg-grey-2" flat>
          <q-card-section class="text-center">
            <!-- We don't have public avatars yet, so we use a placeholder icon -->
            <q-avatar size="80px" class="q-mb-md" icon="person" color="primary" text-color="white" />
            <div class="text-h6">{{ profile.username }}</div>
            <div class-="text-subtitle1 text-grey-8">
              Member Since: {{ formatJoinDate(profile.created_at) }}
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="badge" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>Rank</q-item-label>
                  <q-item-label class="text-weight-bold">{{ profile.rank }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="trending_up" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>XP</q-item-label>
                  <q-item-label class="text-weight-bold">{{ profile.xp }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="military_tech" />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>Badges</q-item-label>
                  <q-item-label v-if="profile.badges && profile.badges.length">
                    <q-chip v-for="badge in profile.badges" :key="badge" color="secondary" text-color="white" size="sm"
                      :label="badge" />
                  </q-item-label>
                  <q-item-label v-else class="text-caption text-grey-7">
                    No badges earned yet.
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Recent Activity -->
      <div class="col-12 col-md-8">
        <h5 class="text-h5 q-mt-none q-mb-md">Recent Activity</h5>

        <div v-if="loading.logs" class="text-center q-pa-md">
          <q-spinner-dots color="primary" size="2em" />
        </div>
        <div v-if="error.logs" class="text-red">
          Error fetching activity: {{ error.logs }}
        </div>

        <div v-if="logs.length === 0 && !loading.logs" class="text-center text-grey-7 q-pa-md">
          <q-icon name="history" size="2em" class="q-mb-sm" />
          <div>No recent activity.</div>
        </div>

        <q-list v-else separator>
          <q-item v-for="log in logs" :key="log.log_id" class="q-py-md">
            <q-item-section avatar>
              <q-icon name="menu_book" color="primary" size="md" />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                Logged a cook for
                <router-link :to="`/recipe/${log.recipe_id}`" class="text-weight-bold text-primary">
                  {{ log.recipe_title }}
                </router-link>
              </q-item-label>

              <q-item-label v-if="log.rating" class="q-mt-xs">
                <q-rating :model-value="log.rating" color="orange" icon="star" size="xs" readonly />
              </q-item-label>

              <q-item-label v-if="log.notes" caption class="q-mt-xs text-italic">
                "{{ log.notes }}"
              </q-item-label>

              <q-item-label caption class="q-mt-sm">
                {{ formatTimeAgo(log.logged_at) }}
              </q-item-label>
            </q-item-section>

          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
// import { useQuasar } from 'quasar';

const route = useRoute();
// const $q = useQuasar();

const API_URL = 'http://localhost:8080/api';
const userId = ref(route.params.id);

const profile = ref(null);
const logs = ref([]);
const loading = reactive({ profile: false, logs: false });
const error = reactive({ profile: null, logs: null });

// --- API Fetch Function (Public, no auth needed) ---
const fetchPublic = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.message || `Server responded with ${response.status}`
    );
  }
  return response.json();
};

// --- API Call Functions ---
const fetchProfile = async (id) => {
  loading.profile = true;
  error.profile = null;
  profile.value = null; // Clear old profile
  try {
    const data = await fetchPublic(`/profile/${id}`);
    profile.value = data;
  } catch (err) {
    error.profile = err.message;
    console.error(err);
  } finally {
    loading.profile = false;
  }
};

const fetchLogs = async (id) => {
  loading.logs = true;
  error.logs = null;
  logs.value = []; // Clear old logs
  try {
    const data = await fetchPublic(`/profile/${id}/logs`);
    logs.value = data;
  } catch (err) {
    error.logs = err.message;
    console.error(err);
  } finally {
    loading.logs = false;
  }
};

// --- Formatters ---
const formatJoinDate = (isoString) => {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
};

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

// --- Lifecycle & Watcher ---
onMounted(() => {
  fetchProfile(userId.value);
  fetchLogs(userId.value);
});

// Watch for route changes (e.g., clicking from one user profile to another)
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      userId.value = newId;
      fetchProfile(newId);
      fetchLogs(newId);
    }
  }
);
</script>

<style scoped>
.text-h5 {
  font-weight: 600;
}

.text-primary {
  color: var(--q-primary) !important;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>
